#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
测试网页收藏功能
"""

import requests
import json

def test_web_collection():
    """测试网页收藏功能"""
    
    # 测试URL
    test_urls = [
        "https://www.sina.com.cn",
        "https://www.qq.com",
        "https://www.163.com"
    ]
    
    api_url = "http://localhost:8000/api/v1/collect"
    
    for url in test_urls:
        print(f"\n=== 测试网页收藏: {url} ===")
        
        # 构建请求数据
        data = {
            "user_id": "test_user",
            "original_text": "",  # 空内容，让后端自动提取
            "source_url": url
        }
        
        try:
            response = requests.post(api_url, json=data, timeout=30)
            
            if response.status_code == 200:
                result = response.json()
                if result.get('success'):
                    print(f"✅ 收藏成功")
                    print(f"收藏ID: {result.get('collection_id')}")
                    print(f"消息: {result.get('message')}")
                else:
                    print(f"❌ 收藏失败")
                    print(f"消息: {result.get('message')}")
            else:
                print(f"❌ HTTP错误: {response.status_code}")
                print(f"响应: {response.text}")
                
        except Exception as e:
            print(f"❌ 请求失败: {str(e)}")

if __name__ == "__main__":
    test_web_collection()