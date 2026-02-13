#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
直接测试网页内容提取功能
"""

from web_content_extractor import extract_web_content

def test_direct_web_extraction():
    """直接测试网页内容提取"""
    
    test_url = "https://www.sina.com.cn"
    
    print(f"直接测试网页内容提取 - URL: {test_url}")
    
    try:
        success, web_content, error = extract_web_content(test_url)
        
        if success:
            print(f"✅ 网页内容提取成功")
            print(f"标题: {web_content['title']}")
            print(f"内容长度: {web_content['content_length']}")
            print(f"字数: {web_content['word_count']}")
            print(f"内容预览: {web_content['content'][:200]}...")
            
            # 验证内容质量
            if web_content['content_length'] >= 10:
                print("✅ 内容长度验证通过")
            else:
                print("❌ 内容长度不足")
                
        else:
            print(f"❌ 网页内容提取失败: {error}")
            
    except Exception as e:
        print(f"❌ 测试异常: {str(e)}")

if __name__ == "__main__":
    test_direct_web_extraction()