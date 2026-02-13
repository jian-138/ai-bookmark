#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
测试网页内容提取功能
"""

from web_content_extractor import extract_web_content

def test_web_extraction():
    """测试网页内容提取"""
    test_urls = [
        "https://www.baidu.com",
        "https://www.qq.com",
        "https://www.sina.com.cn"
    ]
    
    for url in test_urls:
        print(f"\n=== 测试URL: {url} ===")
        success, content, error = extract_web_content(url)
        
        if success:
            print(f"✅ 提取成功")
            print(f"标题: {content['title']}")
            print(f"内容长度: {content['content_length']}")
            print(f"字数: {content['word_count']}")
            print(f"内容预览: {content['content'][:200]}...")
        else:
            print(f"❌ 提取失败: {error}")

if __name__ == "__main__":
    test_web_extraction()