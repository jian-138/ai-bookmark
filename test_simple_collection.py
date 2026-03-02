#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
简单测试收藏功能
"""

import requests
import json

def test_simple_collection():
    """测试简单收藏功能"""
    
    api_url = "http://localhost:8000/api/v1/collect"
    
    # 测试1: 普通文本收藏
    print("=== 测试普通文本收藏 ===")
    data = {
        "user_id": "test_user",
        "original_text": "这是一个测试文本，用于测试收藏功能。",
        "source_url": "https://example.com"
    }
    
    try:
        response = requests.post(api_url, json=data, timeout=30)
        print(f"响应状态: {response.status_code}")
        print(f"响应内容: {response.text}")
        
        if response.status_code == 200:
            result = response.json()
            print(f"成功: {result}")
        else:
            print(f"失败: {response.text}")
            
    except Exception as e:
        print(f"请求失败: {str(e)}")

if __name__ == "__main__":
    test_simple_collection()