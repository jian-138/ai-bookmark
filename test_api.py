#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
测试AI书签收藏助手API功能
"""

import requests
import json
import time

def test_api():
    print("🚀 正在测试AI书签收藏助手API...")
    print("=" * 50)
    
    # 测试1: 收藏文本
    print("\n📝 测试1: 收藏文本内容")
    text_data = {
        'user_id': 'test_user',
        'original_text': '这是一段测试文本，用于验证AI书签收藏助手的功能。AI技术正在快速发展，改变着我们的生活方式。',
        'title': '测试收藏'
    }
    
    try:
        response = requests.post('http://localhost:8000/api/v1/collect', json=text_data)
        print(f"   状态码: {response.status_code}")
        if response.status_code == 201:
            result = response.json()
            print(f"   ✅ 收藏成功! ID: {result.get('collect_id', 'Unknown')}")
        else:
            print(f"   ❌ 收藏失败: {response.text}")
    except Exception as e:
        print(f"   ❌ 请求异常: {str(e)}")
    
    print("\n🌐 测试2: 收藏网页URL")
    # 测试2: 收藏网页URL
    url_data = {
        'user_id': 'test_user',
        'original_text': '',
        'source_url': 'https://www.example.com',
        'title': 'Example Domain'
    }
    
    try:
        response = requests.post('http://localhost:8000/api/v1/collect', json=url_data)
        print(f"   状态码: {response.status_code}")
        if response.status_code == 201:
            result = response.json()
            print(f"   ✅ 网页收藏成功! ID: {result.get('collect_id', 'Unknown')}")
        else:
            print(f"   ❌ 网页收藏失败: {response.text}")
    except Exception as e:
        print(f"   ❌ 请求异常: {str(e)}")
    
    print("\n📋 测试3: 获取收藏列表")
    # 测试3: 获取收藏列表
    try:
        response = requests.get('http://localhost:8000/api/v1/collections?user_id=test_user&page=1&size=10')
        print(f"   状态码: {response.status_code}")
        if response.status_code == 200:
            result = response.json()
            total = result.get('total', 0)
            print(f"   ✅ 获取收藏列表成功! 总数: {total}")
        else:
            print(f"   ❌ 获取收藏列表失败: {response.text}")
    except Exception as e:
        print(f"   ❌ 请求异常: {str(e)}")
    
    print("\n📊 测试4: API文档访问")
    # 测试4: API文档
    try:
        response = requests.get('http://localhost:8000/docs')
        print(f"   状态码: {response.status_code}")
        if response.status_code == 200:
            print(f"   ✅ API文档访问成功! 长度: {len(response.text)} 字符")
        else:
            print(f"   ❌ API文档访问失败")
    except Exception as e:
        print(f"   ❌ 请求异常: {str(e)}")
    
    print("\n" + "=" * 50)
    print("✅ 所有测试完成!")

if __name__ == "__main__":
    test_api()