#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
测试收藏路由是否正常工作
"""

import requests
import json

def test_collection_route():
    """测试收藏路由"""
    
    # 测试常规文本收藏
    data = {
        "user_id": "test_user",
        "original_text": "这是一个测试文本，用于验证收藏功能是否正常工作。",
        "title": "测试收藏",
        "source_url": ""
    }
    
    print(f"测试常规文本收藏功能")
    print(f"请求数据: {json.dumps(data, indent=2)}")
    
    try:
        # 发送请求到API
        response = requests.post(
            "http://localhost:8001/api/v1/collect",
            json=data,
            headers={"Content-Type": "application/json"}
        )
        
        print(f"响应状态码: {response.status_code}")
        print(f"响应内容: {response.text}")
        
        if response.status_code == 200:
            result = response.json()
            print(f"收藏成功: {result}")
        else:
            print(f"收藏失败: {response.text}")
            
    except Exception as e:
        print(f"测试失败: {str(e)}")

if __name__ == "__main__":
    test_collection_route()