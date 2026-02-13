#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
网页内容提取器
实现网页内容的抓取、过滤和文本提取功能
"""

import requests
import re
from bs4 import BeautifulSoup
from urllib.parse import urlparse
import time
from typing import Optional, Dict, Tuple


class WebContentExtractor:
    """网页内容提取器"""
    
    def __init__(self):
        # 设置请求头，模拟浏览器访问
        self.headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
            'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8',
            'Accept-Encoding': 'gzip, deflate',
            'Connection': 'keep-alive',
            'Upgrade-Insecure-Requests': '1',
        }
        
        # 请求超时设置
        self.timeout = 10
        
        # 需要过滤的标签和内容
        self.filter_tags = ['script', 'style', 'nav', 'header', 'footer', 'aside', 'noscript']
        self.filter_classes = [
            'ad', 'ads', 'advertisement', 'banner', 'sidebar', 'menu', 'navigation',
            'footer', 'header', 'comment', 'comments', 'share', 'social', 'related',
            'recommend', 'popup', 'modal', 'cookie', 'notification'
        ]
        
    def extract_content(self, url: str) -> Tuple[bool, Optional[Dict], Optional[str]]:
        """
        提取网页主要内容
        
        Args:
            url: 网页URL
            
        Returns:
            (success, content_data, error_message)
        """
        try:
            # 验证URL格式
            if not self._validate_url(url):
                return False, None, "无效的URL格式"
            
            # 获取网页内容
            html_content = self._fetch_html(url)
            if not html_content:
                return False, None, "无法获取网页内容"
            
            # 解析HTML
            soup = BeautifulSoup(html_content, 'html.parser')
            
            # 过滤非内容元素
            self._remove_unwanted_elements(soup)
            
            # 提取标题
            title = self._extract_title(soup)
            
            # 提取正文内容
            main_content = self._extract_main_content(soup)
            
            # 清理和格式化文本
            cleaned_content = self._clean_text(main_content)
            
            # 验证内容质量
            if not self._validate_content_quality(cleaned_content):
                return False, None, "网页内容质量不足，无法收藏"
            
            # 返回提取结果
            content_data = {
                'title': title,
                'content': cleaned_content,
                'url': url,
                'extracted_at': time.time(),
                'content_length': len(cleaned_content),
                'word_count': len(cleaned_content.split())
            }
            
            return True, content_data, None
            
        except Exception as e:
            return False, None, f"提取网页内容失败: {str(e)}"
    
    def _validate_url(self, url: str) -> bool:
        """验证URL格式"""
        try:
            result = urlparse(url)
            return all([result.scheme, result.netloc])
        except:
            return False
    
    def _fetch_html(self, url: str) -> Optional[str]:
        """获取网页HTML内容"""
        try:
            response = requests.get(
                url, 
                headers=self.headers, 
                timeout=self.timeout,
                allow_redirects=True
            )
            response.raise_for_status()
            
            # 检查内容类型
            content_type = response.headers.get('content-type', '').lower()
            if 'text/html' not in content_type:
                return None
            
            # 检测编码并解码
            response.encoding = response.apparent_encoding
            return response.text
            
        except Exception as e:
            print(f"获取网页内容失败: {str(e)}")
            return None
    
    def _remove_unwanted_elements(self, soup: BeautifulSoup) -> None:
        """移除不需要的HTML元素"""
        # 移除指定标签
        for tag in self.filter_tags:
            for element in soup.find_all(tag):
                element.decompose()
        
        # 移除指定class的元素
        for class_name in self.filter_classes:
            for element in soup.find_all(class_=re.compile(class_name, re.I)):
                element.decompose()
        
        # 移除空标签
        for element in soup.find_all():
            if not element.get_text(strip=True):
                element.decompose()
    
    def _extract_title(self, soup: BeautifulSoup) -> str:
        """提取网页标题"""
        # 尝试多种标题选择器
        title_selectors = [
            'title',
            'h1',
            '.title',
            '.headline',
            '[class*="title"]',
            '[class*="headline"]'
        ]
        
        for selector in title_selectors:
            element = soup.select_one(selector)
            if element and element.get_text(strip=True):
                return element.get_text(strip=True)
        
        return "无标题"
    
    def _extract_main_content(self, soup: BeautifulSoup) -> str:
        """提取正文内容"""
        # 尝试多种内容选择器
        content_selectors = [
            'article',
            '.article',
            '.content',
            '.main-content',
            '.post-content',
            '.entry-content',
            'main',
            '[role="main"]'
        ]
        
        for selector in content_selectors:
            element = soup.select_one(selector)
            if element and element.get_text(strip=True):
                return element.get_text(separator='\n', strip=True)
        
        # 如果没有找到特定内容区域，提取body内容
        body = soup.find('body')
        if body:
            return body.get_text(separator='\n', strip=True)
        
        return soup.get_text(separator='\n', strip=True)
    
    def _clean_text(self, text: str) -> str:
        """清理和格式化文本"""
        # 移除多余的空格和换行
        text = re.sub(r'\s+', ' ', text)
        text = re.sub(r'\n\s*\n', '\n\n', text)
        
        # 移除特殊字符但保留中文标点
        text = re.sub(r'[^\w\s\u4e00-\u9fff\u3000-\u303f\uff00-\uffef\.,!?;:()\[\]\-]', '', text)
        
        # 标准化标点符号
        text = re.sub(r'[\u3000]', ' ', text)  # 全角空格转半角
        text = re.sub(r'[\uff01-\uff5e]', lambda x: chr(ord(x.group()) - 0xfee0), text)  # 全角转半角
        
        return text.strip()
    
    def _validate_content_quality(self, content: str) -> bool:
        """验证内容质量"""
        # 检查内容长度
        if len(content) < 50:  # 降低到至少50个字符
            return False
        
        # 检查中文字符比例（放宽条件）
        chinese_chars = len(re.findall(r'[\u4e00-\u9fff]', content))
        total_chars = len(content)
        
        # 如果内容长度足够，放宽中文比例要求
        if total_chars > 200 and chinese_chars / total_chars < 0.05:  # 降低到5%
            return False
        
        # 检查段落结构（放宽条件）
        paragraphs = [p for p in content.split('\n') if p.strip()]
        if len(paragraphs) < 1:  # 降低到至少1个段落
            return False
        
        return True


# 全局实例
web_content_extractor = WebContentExtractor()

def extract_web_content(url: str) -> Tuple[bool, Optional[Dict], Optional[str]]:
    """
    提取网页内容的便捷函数
    
    Args:
        url: 网页URL
        
    Returns:
        (success, content_data, error_message)
    """
    return web_content_extractor.extract_content(url)


if __name__ == "__main__":
    # 测试功能
    test_url = "https://example.com"
    success, content, error = extract_web_content(test_url)
    
    if success:
        print("网页内容提取成功:")
        print(f"标题: {content['title']}")
        print(f"内容长度: {content['content_length']}")
        print(f"字数: {content['word_count']}")
        print(f"内容预览: {content['content'][:200]}...")
    else:
        print(f"提取失败: {error}")