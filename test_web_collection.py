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
    test_url = "https://www.sina.com.cn"
    
    # 测试数据
    data = {
        "user_id": "test_user",
        "original_text": "",  # 空内容，触发网页提取
        "source_url": test_url,
        "title": "测试网页收藏"
    }
    
    print(f"测试网页收藏功能 - URL: {test_url}")
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
    test_web_collection()