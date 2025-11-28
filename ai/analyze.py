# ai/analyze.py
import os
import requests
from dotenv import load_dotenv

load_dotenv()

SILICONFLOW_API_KEY = os.getenv("SILICONFLOW_API_KEY", "").strip()
SILICONFLOW_ENDPOINT = os.getenv("SILICONFLOW_ENDPOINT", "https://api.siliconflow.cn/v1/chat/completions").strip()
SILICONFLOW_MODEL = os.getenv("SILICONFLOW_MODEL", "Qwen/QwQ-32B")

# 调用失败返回的固定数据
FIXED_RESULT = {
    "keywords": ["人工智能", "教育", "机器学习"],
    "category": "科技,教育",
    "summary": "AI 通过个性化路径提升教育效果。",
    "confidence": 0.91
}

def analyze_text(text: str) -> tuple[dict, str | None]:
    """调用硅基流动 Chat Completions API 分析文本"""
    if not SILICONFLOW_API_KEY:
        return FIXED_RESULT, "API Key 未配置"

    headers = {
        "Authorization": f"Bearer {SILICONFLOW_API_KEY}",
        "Content-Type": "application/json"
    }

    payload = {
        "model": SILICONFLOW_MODEL,
        "messages": [
            {"role": "user", "content": f"请提取文本的关键词、分类和摘要：{text}"}
        ],
        "stream": False
    }

    try:
        response = requests.post(SILICONFLOW_ENDPOINT, json=payload, headers=headers, timeout=30)
        response.raise_for_status()
        data = response.json()

        # 解析模型返回内容（假设返回 choices[0].message.content）
        content = data.get("choices", [{}])[0].get("message", {}).get("content", "")
        # 简单解析：假设模型返回 JSON 字符串
        import json
        try:
            result = json.loads(content)
        except Exception:
            result = FIXED_RESULT
            return result, "解析 API 返回内容失败，使用固定数据"

        # 检查必要字段
        if not all(k in result for k in ["keywords", "category", "summary", "confidence"]):
            return FIXED_RESULT, "API 返回数据不完整"

        return result, None
    except Exception as e:
        return FIXED_RESULT, f"调用硅基流动 API 失败: {str(e)}"
