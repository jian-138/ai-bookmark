#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
详细调试网页收藏过程
"""

import requests
import json

def debug_web_collection():
    """调试网页收藏过程"""
    
    # 获取提取的原始内容
    from web_content_extractor import extract_web_content
    
    test_url = "https://www.example.com"
    print(f"=== 调试网页收藏过程 ===")
    print(f"测试URL: {test_url}")
    
    # 提取网页内容
    success, web_content, error = extract_web_content(test_url)
    print(f"\n1. 网页提取结果:")
    print(f"   成功: {success}")
    if success:
        print(f"   标题: {web_content['title']}")
        print(f"   原始内容长度: {len(web_content['content'])}")
        print(f"   内容预览: {web_content['content'][:200]}...")
    else:
        print(f"   错误: {error}")
        return
    
    # 模拟清理过程
    from utils import sanitize_input, validate_content_length
    
    print(f"\n2. 内容清理过程:")
    original_text = web_content['content']
    print(f"   清理前长度: {len(original_text)}")
    print(f"   清理前内容: {original_text[:200]}...")
    
    sanitized_text = sanitize_input(original_text)
    print(f"   清理后长度: {len(sanitized_text)}")
    print(f"   清理后内容: {sanitized_text[:200]}...")
    
    is_valid = validate_content_length(sanitized_text)
    print(f"   长度验证: {is_valid}")
    
    # 发送收藏请求
    print(f"\n3. 发送收藏请求:")
    collection_data = {
        "user_id": "test_user",
        "source_url": test_url,
        "title": web_content['title'],
        "original_text": ""  # 空内容，让服务器提取
    }
    
    try:
        response = requests.post("http://localhost:8002/api/v1/collect", json=collection_data)
        print(f"   状态码: {response.status_code}")
        print(f"   响应: {response.text}")
        
        if response.status_code == 200:
            result = response.json()
            print(f"   收藏ID: {result.get('collection_id', '无')}")
        
    except Exception as e:
        print(f"   请求异常: {str(e)}")

if __name__ == "__main__":
    debug_web_collection()