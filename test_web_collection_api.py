#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
模拟收藏请求测试网页提取功能
"""

import requests
import json

def test_web_collection():
    """测试网页收藏功能"""
    
    # 测试URL收藏
    test_cases = [
        {
            "url": "http://localhost:8002/api/v1/collect",
            "data": {
                "user_id": "test_user",
                "source_url": "https://www.example.com",
                "title": "测试网页收藏",
                "original_text": ""
            }
        },
        {
            "url": "http://localhost:8002/api/v1/collect", 
            "data": {
                "user_id": "test_user",
                "source_url": "https://www.sina.com.cn",
                "original_text": ""
            }
        }
    ]
    
    for i, test_case in enumerate(test_cases):
        print(f"\n=== 测试用例 {i+1} ===")
        print(f"URL: {test_case['data']['source_url']}")
        
        try:
            response = requests.post(test_case["url"], json=test_case["data"])
            print(f"状态码: {response.status_code}")
            print(f"响应: {response.text}")
            
            if response.status_code == 200:
                result = response.json()
                print(f"成功: {result.get('success', False)}")
                print(f"消息: {result.get('message', '无消息')}")
                if result.get('collection_id'):
                    print(f"收藏ID: {result.get('collection_id')}")
            
        except Exception as e:
            print(f"请求异常: {str(e)}")

if __name__ == "__main__":
    test_web_collection()