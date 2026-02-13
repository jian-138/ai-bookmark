#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
测试AI分析功能的文本编码问题
"""

import requests
import json

def test_ai_analysis():
    """测试AI分析功能"""
    
    # 测试数据 - 包含中文字符
    test_data = {
        "user_id": "usr_test",
        "original_text": "人工智能技术在教育领域的应用正在快速发展。通过机器学习算法，系统可以分析学生的学习行为数据，提供个性化的学习路径推荐，帮助学生更高效地掌握知识。",
        "url": "https://example.com/ai-education-tech"
    }
    
    print("=== 测试AI分析功能 ===")
    print(f"测试文本: {test_data['original_text']}")
    print(f"文本长度: {len(test_data['original_text'])}")
    
    # 发送请求
    try:
        response = requests.post(
            "http://localhost:8000/api/v1/collect",
            json=test_data,
            headers={"Content-Type": "application/json; charset=utf-8"}
        )
        
        print(f"响应状态码: {response.status_code}")
        
        if response.status_code == 201:
            result = response.json()
            print(f"收藏成功: {result}")
            
            # 获取收藏列表验证结果
            collections_response = requests.get(
                "http://localhost:8000/api/v1/collections?page=1&size=5"
            )
            
            if collections_response.status_code == 200:
                collections = collections_response.json()
                print("\n=== 收藏列表验证 ===")
                for item in collections.get("data", []):
                    print(f"收藏ID: {item['collect_id']}")
                    print(f"原始文本: {item['original_text']}")
                    print(f"AI关键词: {item['ai_keywords']}")
                    print(f"AI分类: {item['ai_category']}")
                    print(f"摘要: {item['summary']}")
                    print(f"置信度: {item['ai_confidence']}")
                    print(f"状态: {item['status']}")
                    print("-" * 50)
        else:
            print(f"请求失败: {response.text}")
            
    except Exception as e:
        print(f"测试过程中发生错误: {str(e)}")

if __name__ == "__main__":
    test_ai_analysis()