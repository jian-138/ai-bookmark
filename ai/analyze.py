import os
import requests
import json
import re
from dotenv import load_dotenv

# 加载环境变量
load_dotenv()

API_KEY = os.getenv("SILICONFLOW_API_KEY")
MODEL = os.getenv("SILICONFLOW_MODEL", "Qwen/QwQ-32B")
ENDPOINT = os.getenv("SILICONFLOW_ENDPOINT", "https://api.siliconflow.cn/v1/chat/completions")

print(f"API_KEY配置状态: {'已设置' if API_KEY else '未设置'}")
print(f"MODEL配置: {MODEL}")
print(f"ENDPOINT配置: {ENDPOINT}")

FALLBACK = {
    "success": True,
    "keywords": ["人工智能", "教育", "机器学习"],
    "category": "科技,教育",
    "summary": "AI 通过个性化路径提升教育效果。",
    "confidence": 0.91,
    "article_type": "其他",
    "error": None
}

# ---- Schema 修复 ----
def fix_schema(data: dict):
    try:
        conf = float(data.get("confidence", 0.9))
    except:
        conf = 0.9

    return {
        "success": True,
        "keywords": data.get("keywords", []),
        "category": data.get("category", ""),
        "summary": data.get("summary", ""),
        "confidence": conf,
        "article_type": data.get("article_type", "其他"),
        "error": None
    }


def extract_json(text: str):
    """
    强鲁棒 JSON 提取（适配模型乱输出 / 半 JSON / 注释 / markdown）
    """
    try:
        print("==== RAW MODEL OUTPUT START ====")
        print(repr(text[:2000]))
        print("==== RAW MODEL OUTPUT END ====")

        # 基础清洗
        text = text.strip()
        text = re.sub(r"```json|```", "", text)
        text = text.replace("“", '"').replace("”", '"')

        # 1️⃣ 尝试直接解析完整 JSON
        try:
            return json.loads(text)
        except:
            pass

        # 2️⃣ 尝试提取第一个完整 JSON 对象 {...}
        match = re.search(r"\{[\s\S]*\}", text)
        if match:
            return json.loads(match.group(0))

        # 3️⃣ 模型只返回字段体（没有外层 {}）
        if '"keywords"' in text:
            start = text.find('"keywords"')
            body = text[start:]

            # 清理尾部无效字符
            body = body.strip()
            body = re.sub(r",\s*$", "", body)

            fixed = "{" + body + "}"

            print("==== FIXED JSON BODY ====")
            print(fixed)
            print("==========================")

            return json.loads(fixed)

        print("[ERROR] JSON 提取失败")
        return None

    except Exception as e:
        print("[ERROR] JSON 解析异常:", str(e))
        return None



# ---- Prompt ----
AI_ANALYZE_PROMPT = """
你是一名专业中文文本分析模型。
必须严格返回 JSON，不允许输出解释或多余文本。

任务：
1. keywords：3–8 个关键词数组
2. category：1–3 个分类标签（字符串）
3. summary：15–40 字摘要
4. confidence：0–1 可信度

返回格式：
{
  "keywords": [],
  "category": "",
  "summary": "",
  "confidence": 0.0
}
"""

WECHAT_PROMPT_TEMPLATE = """
请分析以下微信公众号文章，并只返回 JSON：

标题：
{title}

正文：
{content}

要求返回：
{
  "keywords": ["词1","词2","词3","词4","词5"],
  "category": "分类1,分类2",
  "summary": "100字以内摘要，包含核心观点",
  "article_type": "技术/资讯/观点/教程/其他",
  "confidence": 0.0
}
"""

print(">>> call_siliconflow NEW VERSION LOADED")

def call_siliconflow(prompt: str):
    """调用 SiliconFlow API 进行 AI 分析"""
    if not API_KEY:
        print("[ERROR] AI 分析失败：未设置 API Key")
        return FALLBACK, "未设置 API Key"

    headers = {
        "Authorization": f"Bearer {API_KEY}",
        "Content-Type": "application/json"
    }

    payload = {
        "model": MODEL,
        "messages": [
            {"role": "system", "content": "你必须严格只输出 JSON，不允许输出解释或多余文本"},
            {"role": "user", "content": prompt}
        ],
        "temperature": 0.2,
    }

    print(f"[AI] 发送 AI 分析请求到：{ENDPOINT}")
    print(f"请求内容长度：{len(prompt)} 字符")
    print(f"请求内容预览：{prompt[:200]}...")

    try:
        resp = requests.post(ENDPOINT, headers=headers, json=payload, timeout=90)

        print(f"[AI] AI 分析响应状态码：{resp.status_code}")
        
        if resp.status_code != 200:
            error_msg = f"硅基流动错误：{resp.status_code} {resp.text}"
            print(f"[ERROR] {error_msg}")
            return FALLBACK, error_msg

        data = resp.json()
        raw = data["choices"][0]["message"]["content"]

        print("=== SiliconFlow Raw Response ===")
        print(resp.text[:1200])
        print("================================")

        parsed = extract_json(raw)

        if not parsed:
            error_msg = f"JSON 解析失败，原始输出：{raw[:300]}"
            print(f"[ERROR] {error_msg}")
            return FALLBACK, error_msg

        fixed = fix_schema(parsed)
        print(f"[OK] AI 分析成功，结果：{fixed}")
        return fixed, None

    except requests.exceptions.Timeout:
        error_msg = "AI 分析请求超时（90 秒）"
        print(f"[ERROR] {error_msg}")
        return FALLBACK, error_msg
    except requests.exceptions.ConnectionError:
        error_msg = "无法连接到 AI 服务，请检查网络"
        print(f"[ERROR] {error_msg}")
        return FALLBACK, error_msg
    except Exception as e:
        error_msg = f"调用异常：{str(e)}"
        print(f"[ERROR] {error_msg}")
        return FALLBACK, error_msg


def analyze_text(text: str):
    prompt = AI_ANALYZE_PROMPT + "\n\n文本内容：\n" + text
    return call_siliconflow(prompt)


from ai.ai_processor import preprocess_article_content

def analyze_wechat_article(content: str, title: str):
    try:
        processed_content = preprocess_article_content(content)
        prompt = f"""
你是一个信息分析助手，请从公众号文章中提取：
- keywords (数组)
- category (字符串)
- summary (字符串)
- confidence (0-1)

只返回 JSON，不要输出其他文字。

标题：{title}
正文：{processed_content[:3000]}
"""

        raw, call_err = call_siliconflow(prompt)

        print("WECHAT RAW MODEL OUTPUT =")
        print(raw)

        if call_err:
            return None, f"模型调用失败: {call_err}"

        if not raw:
            return None, "模型无返回"

        # 🚑 如果模型层已经返回 dict，直接用
        if isinstance(raw, dict):
            return raw, None

        # 🚑 如果是字符串才走 JSON 清洗
        if isinstance(raw, str):
            raw = raw.strip()

            if raw.startswith("```"):
                raw = raw.strip("```").strip("json").strip()

            start = raw.find("{")
            end = raw.rfind("}")

            if start == -1 or end == -1:
                return None, "模型返回非 JSON"

            raw = raw[start:end+1]

            try:
                data = json.loads(raw)
                return data, None
            except Exception as e:
                return None, f"JSON解析失败: {str(e)}"

        return None, "未知模型返回格式"

    except Exception as e:
        return None, f"analyze_wechat_article 内部错误: {str(e)}"
