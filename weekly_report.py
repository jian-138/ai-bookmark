#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
周报功能模块
实现每周收藏内容的智能总结和报告生成
"""

import os
import json
import time
from datetime import datetime, timedelta
from typing import List, Dict, Optional, Tuple
from collections import Counter
import asyncio

from ai.analyze import analyze_text
from models import WeeklyReportSummary, WeeklyReportContent


class WeeklyReportGenerator:
    """周报生成器"""
    
    def __init__(self):
        self.collections_storage = None  # 将在使用时动态设置
        
    def set_collections_storage(self, storage):
        """设置收藏数据存储"""
        self.collections_storage = storage
        
    def get_weekly_collections(self, user_id: str, week_start: str, week_end: str) -> List[dict]:
        """获取指定用户当周的收藏内容"""
        try:
            if not self.collections_storage:
                print("警告: 收藏数据存储未设置，无法获取周收藏内容")
                return []
                
            # 将日期字符串转换为UTC时区的datetime对象
            week_start_dt = datetime.fromisoformat(week_start).replace(tzinfo=None)
            week_end_dt = datetime.fromisoformat(week_end).replace(tzinfo=None)
            
            weekly_collections = []
            for collection in self.collections_storage:
                if collection.get('user_id') == user_id:
                    # 将UTC时间字符串转换为本地时区的datetime对象
                    created_at_str = collection['created_at'].replace('Z', '+00:00')
                    created_at = datetime.fromisoformat(created_at_str).replace(tzinfo=None)
                    
                    # 比较日期（忽略时区）
                    if week_start_dt <= created_at <= week_end_dt:
                        weekly_collections.append(collection)
            
            print(f"获取到用户 {user_id} 的周收藏内容: {len(weekly_collections)} 条")
            return weekly_collections
        except Exception as e:
            print(f"获取周收藏内容失败: {str(e)}")
            return []
    
    def analyze_categories(self, collections: List[dict]) -> Dict[str, int]:
        """分析收藏内容分类"""
        categories = Counter()
        for collection in collections:
            category = collection.get('ai_category', '未分类')
            if category:
                # 处理多个分类的情况
                for cat in category.split(','):
                    cat = cat.strip()
                    if cat:
                        categories[cat] += 1
        
        return dict(categories)
    
    def extract_top_keywords(self, collections: List[dict], top_n: int = 10) -> List[str]:
        """提取热门关键词"""
        all_keywords = []
        for collection in collections:
            keywords = collection.get('ai_keywords', [])
            if keywords:
                all_keywords.extend(keywords)
        
        # 统计词频
        keyword_counter = Counter(all_keywords)
        return [kw for kw, _ in keyword_counter.most_common(top_n)]
    
    def analyze_weekly_trend(self, collections: List[dict], week_start: str) -> Dict[str, int]:
        """分析周内收藏趋势"""
        week_start_dt = datetime.fromisoformat(week_start).replace(tzinfo=None)
        trend = {}
        
        # 初始化一周的日期
        for i in range(7):
            date_str = (week_start_dt + timedelta(days=i)).strftime('%Y-%m-%d')
            trend[date_str] = 0
        
        # 统计每日收藏数量
        for collection in collections:
            created_at_str = collection['created_at'].replace('Z', '+00:00')
            created_at = datetime.fromisoformat(created_at_str).replace(tzinfo=None)
            date_str = created_at.strftime('%Y-%m-%d')
            if date_str in trend:
                trend[date_str] += 1
        
        return trend
    
    def calculate_reading_time(self, collections: List[dict]) -> int:
        """计算总阅读时间（估算）"""
        total_time = 0
        for collection in collections:
            text = collection.get('original_text', '')
            # 估算阅读时间：平均阅读速度200字/分钟
            word_count = len(text)
            reading_time = max(1, word_count // 200)  # 至少1分钟
            total_time += reading_time
        
        return total_time
    
    def generate_category_analysis(self, collections: List[dict]) -> List[dict]:
        """生成分类详细分析"""
        category_data = {}
        
        for collection in collections:
            category = collection.get('ai_category', '未分类')
            if category:
                for cat in category.split(','):
                    cat = cat.strip()
                    if cat not in category_data:
                        category_data[cat] = {
                            'count': 0,
                            'keywords': [],
                            'collections': []
                        }
                    
                    category_data[cat]['count'] += 1
                    category_data[cat]['keywords'].extend(collection.get('ai_keywords', []))
                    category_data[cat]['collections'].append({
                        'id': collection.get('collect_id'),
                        'title': collection.get('original_text', '')[:50] + '...',
                        'summary': collection.get('summary', '')
                    })
        
        # 处理分析结果
        analysis = []
        for category, data in category_data.items():
            # 提取该分类的热门关键词
            keyword_counter = Counter(data['keywords'])
            top_keywords = [kw for kw, _ in keyword_counter.most_common(5)]
            
            analysis.append({
                'category': category,
                'count': data['count'],
                'top_keywords': top_keywords,
                'representative_collections': data['collections'][:3]  # 取前3个代表性收藏
            })
        
        return analysis
    
    def select_top_collections(self, collections: List[dict], top_n: int = 5) -> List[dict]:
        """选择重要收藏内容"""
        # 根据置信度和文本长度排序
        scored_collections = []
        for collection in collections:
            score = collection.get('ai_confidence', 0) * 0.7
            score += min(len(collection.get('original_text', '')) / 1000, 0.3)  # 文本长度权重
            scored_collections.append((score, collection))
        
        # 按分数排序
        scored_collections.sort(key=lambda x: x[0], reverse=True)
        
        return [collection for _, collection in scored_collections[:top_n]]
    
    def generate_keyword_cloud(self, collections: List[dict]) -> List[dict]:
        """生成关键词云数据"""
        all_keywords = []
        for collection in collections:
            keywords = collection.get('ai_keywords', [])
            if keywords:
                all_keywords.extend(keywords)
        
        keyword_counter = Counter(all_keywords)
        
        # 生成词云数据格式
        cloud_data = []
        for keyword, count in keyword_counter.most_common(20):  # 取前20个关键词
            # 根据词频计算字体大小
            size = min(40, max(12, count * 3))
            cloud_data.append({
                'text': keyword,
                'size': size,
                'count': count
            })
        
        return cloud_data
    
    def analyze_time_distribution(self, collections: List[dict]) -> dict:
        """分析时间分布"""
        time_slots = {
            'morning': 0,    # 6:00-12:00
            'afternoon': 0,  # 12:00-18:00
            'evening': 0,    # 18:00-24:00
            'night': 0       # 0:00-6:00
        }
        
        for collection in collections:
            created_at_str = collection['created_at'].replace('Z', '+00:00')
            created_at = datetime.fromisoformat(created_at_str).replace(tzinfo=None)
            hour = created_at.hour
            
            if 6 <= hour < 12:
                time_slots['morning'] += 1
            elif 12 <= hour < 18:
                time_slots['afternoon'] += 1
            elif 18 <= hour < 24:
                time_slots['evening'] += 1
            else:
                time_slots['night'] += 1
        
        return time_slots
    
    async def generate_weekly_summary(self, collections: List[dict]) -> str:
        """使用AI生成周报摘要"""
        if not collections:
            return "本周暂无收藏内容"
        
        # 准备分析数据
        categories = self.analyze_categories(collections)
        top_keywords = self.extract_top_keywords(collections, 5)
        total_count = len(collections)
        
        # 构建AI提示
        prompt = f"""
        请为以下收藏内容生成一个简洁的周报摘要：
        
        收藏统计：
        - 总收藏数：{total_count}
        - 主要分类：{', '.join(list(categories.keys())[:3])}
        - 热门关键词：{', '.join(top_keywords)}
        
        请用100字以内总结本周的收藏特点和知识收获。
        """
        
        try:
            result, error = analyze_text(prompt)
            if result and not error:
                return result.get('summary', '本周收藏内容丰富，涵盖了多个知识领域。')
        except Exception as e:
            print(f"AI生成周报摘要失败: {str(e)}")
        
        # 降级处理
        return f"本周共收藏{total_count}条内容，主要涉及{', '.join(list(categories.keys())[:2])}等领域。"
    
    def generate_weekly_report(self, user_id: str, week_start: str, week_end: str) -> Tuple[bool, Optional[WeeklyReportContent], str]:
        """生成周报"""
        try:
            # 获取当周收藏内容
            collections = self.get_weekly_collections(user_id, week_start, week_end)
            
            if not collections:
                return False, None, "本周暂无收藏内容"
            
            # 生成摘要统计
            summary = WeeklyReportSummary(
                total_collections=len(collections),
                categories=self.analyze_categories(collections),
                top_keywords=self.extract_top_keywords(collections, 10),
                weekly_trend=self.analyze_weekly_trend(collections, week_start),
                reading_time_total=self.calculate_reading_time(collections)
            )
            
            # 生成详细内容
            report_content = WeeklyReportContent(
                summary=summary,
                category_analysis=self.generate_category_analysis(collections),
                top_collections=self.select_top_collections(collections),
                keyword_cloud=self.generate_keyword_cloud(collections),
                time_distribution=self.analyze_time_distribution(collections)
            )
            
            return True, report_content, "周报生成成功"
            
        except Exception as e:
            print(f"生成周报失败: {str(e)}")
            return False, None, f"周报生成失败: {str(e)}"


# 全局周报生成器实例（延迟创建）
_weekly_report_generator = None

def get_weekly_report_generator():
    """获取周报生成器实例"""
    global _weekly_report_generator
    if _weekly_report_generator is None:
        _weekly_report_generator = WeeklyReportGenerator()
    return _weekly_report_generator

# 为了向后兼容，保留原变量名
weekly_report_generator = get_weekly_report_generator()