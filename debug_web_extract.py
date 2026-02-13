#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
调试网页内容提取功能
"""

from web_content_extractor import extract_web_content
import traceback

def test_web_extraction():
    """测试网页内容提取"""
    
    test_urls = [
        'https://www.example.com',
        'https://www.sina.com.cn',
        'https://mp.weixin.qq.com/s/test'
    ]
    
    for url in test_urls:
        print(f'测试URL: {url}')
        try:
            success, content, error = extract_web_content(url)
            if success:
                print(f'✅ 成功 - 标题: {content["title"]} - 长度: {content["content_length"]}')
            else:
                print(f'❌ 失败 - 错误: {error}')
        except Exception as e:
            print(f'❌ 异常: {str(e)}')
            traceback.print_exc()
        print('---')

if __name__ == "__main__":
    test_web_extraction()