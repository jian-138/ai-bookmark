import re
from datetime import datetime
from typing import Dict, Any
import hashlib
import json


def generate_collection_id(user_id: str, content: str) -> str:
    """生成唯一的收藏ID"""
    import uuid
    # 使用UUID生成唯一ID，确保格式正确
    unique_id = str(uuid.uuid4())
    return f"coll_{unique_id}"


def extract_keywords(text: str, max_keywords: int = 10) -> list:
    """从文本中提取关键词（简化版实现）"""
    # 简单的关键词提取：按标点符号分割，取较长的词组
    sentences = re.split(r'[，。！？；,.\!\?;]', text)
    keywords = []
    
    for sentence in sentences:
        sentence = sentence.strip()
        if len(sentence) > 5:  # 至少5个字符
            # 按空格分割词语
            words = sentence.split()
            for word in words:
                word = word.strip('\'"()[]{}')
                if len(word) >= 3 and word not in keywords:  # 至少3个字符且未重复
                    keywords.append(word)
                    
    return keywords[:max_keywords]


def sanitize_input(text: str) -> str:
    """清理输入文本"""
    if not text:
        return ""
    
    # 移除多余的空白字符
    text = re.sub(r'\s+', ' ', text)
    return text.strip()


def validate_content_length(content: str, min_length: int = 10) -> bool:
    """验证内容长度"""
    return len(content) >= min_length


def format_response(success: bool, message: str, **kwargs) -> Dict[str, Any]:
    """格式化响应数据"""
    response = {"success": success, "message": message}
    response.update(kwargs)
    return response


def get_current_timestamp():
    """获取当前时间戳"""
    return datetime.now().isoformat()


def calculate_reading_time(text: str) -> int:
    """计算阅读时间（分钟）"""
    # 假设每分钟阅读200字
    word_count = len(text)
    minutes = max(1, word_count // 200)  # 至少1分钟
    return minutes


def format_ai_analysis_result(result: dict) -> dict:
    """格式化AI分析结果"""
    return {
        "keywords": result.get("keywords", []),
        "category": result.get("category", ""),
        "summary": result.get("summary", ""),
        "confidence": result.get("confidence", 0.0),
        "article_type": result.get("article_type", "其他")
    }


def merge_collection_with_analysis(collection: dict, analysis_result: dict) -> dict:
    """将收藏数据与AI分析结果合并"""
    updated_collection = collection.copy()
    
    # 添加AI分析结果到收藏数据中（兼容前端字段名）
    updated_collection.update({
        # 兼容前端显示的字段名
        "keywords": analysis_result.get("keywords", []),
        "category": analysis_result.get("category", ""),
        "summary": analysis_result.get("summary", ""),
        "confidence": analysis_result.get("confidence", 0.0),
        "article_type": analysis_result.get("article_type", "其他"),
        # 保留原始AI分析字段用于调试
        "ai_keywords": analysis_result.get("keywords", []),
        "ai_category": analysis_result.get("category", ""),
        "ai_summary": analysis_result.get("summary", ""),
        "ai_confidence": analysis_result.get("confidence", 0.0),
        "ai_article_type": analysis_result.get("article_type", "其他")
    })
    
    return updated_collection