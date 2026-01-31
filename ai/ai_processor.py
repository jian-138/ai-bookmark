# ai/ai_processor.py

def preprocess_article_content(content: str, max_length: int = 3000) -> str:
    """
    公众号文章内容预处理
    - 去广告
    - 智能截断
    """

    if not content:
        return ""

    ad_keywords = [
        '点击关注', '长按识别', '扫码关注', 
        '往期推荐', '广告', '推广', '赞赏'
    ]

    lines = content.split('\n')
    cleaned_lines = [
        line.strip() 
        for line in lines 
        if line.strip() and not any(kw in line for kw in ad_keywords)
    ]

    content = '\n'.join(cleaned_lines)

    # 智能截断（保留头尾）
    if len(content) > max_length:
        head_len = int(max_length * 0.65)
        tail_len = int(max_length * 0.35)
        content = content[:head_len] + "\n...\n" + content[-tail_len:]

    return content.strip()
