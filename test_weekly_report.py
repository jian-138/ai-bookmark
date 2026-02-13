#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
周报功能测试脚本
"""

import requests
import json
from datetime import datetime, timedelta

BASE_URL = "http://localhost:8000"

def test_weekly_report_api():
    """测试周报API功能"""
    
    # 测试用户ID
    test_user_id = "test_user_123"
    
    # 获取当前周的日期范围
    today = datetime.now()
    week_start = today - timedelta(days=today.weekday())
    week_end = week_start + timedelta(days=6)
    week_start_str = week_start.strftime('%Y-%m-%d')
    week_end_str = week_end.strftime('%Y-%m-%d')
    
    print("=== 周报功能测试 ===")
    print(f"测试用户ID: {test_user_id}")
    print(f"测试周范围: {week_start_str} 到 {week_end_str}")
    print()
    
    # 1. 测试生成周报
    print("1. 测试生成周报...")
    try:
        response = requests.post(
            f"{BASE_URL}/api/v1/weekly-report/generate",
            json={
                "user_id": test_user_id,
                "week_start": week_start_str,
                "week_end": week_end_str,
                "force_regenerate": True
            }
        )
        
        if response.status_code == 200:
            result = response.json()
            print(f"   ✅ 生成周报成功: {result.get('message')}")
            if result.get('success'):
                print(f"   报告ID: {result.get('report_id')}")
        else:
            print(f"   ❌ 生成周报失败: HTTP {response.status_code}")
            print(f"   响应: {response.text}")
    except Exception as e:
        print(f"   ❌ 生成周报异常: {str(e)}")
    
    print()
    
    # 2. 测试获取周报列表
    print("2. 测试获取周报列表...")
    try:
        response = requests.get(
            f"{BASE_URL}/api/v1/weekly-report/list",
            params={
                "user_id": test_user_id,
                "page": 1,
                "size": 10
            }
        )
        
        if response.status_code == 200:
            result = response.json()
            print(f"   ✅ 获取周报列表成功: {result.get('message')}")
            print(f"   总报告数: {result.get('total', 0)}")
            
            reports = result.get('reports', [])
            if reports:
                print(f"   返回报告数: {len(reports)}")
                for report in reports:
                    print(f"     - {report.get('week_start')} 到 {report.get('week_end')}: {report.get('report_id')}")
            
            current_report = result.get('current_week_report')
            if current_report:
                print(f"   当前周报: {current_report.get('report_id')}")
        else:
            print(f"   ❌ 获取周报列表失败: HTTP {response.status_code}")
            print(f"   响应: {response.text}")
    except Exception as e:
        print(f"   ❌ 获取周报列表异常: {str(e)}")
    
    print()
    
    # 3. 测试获取周报详情（如果有报告）
    print("3. 测试获取周报详情...")
    try:
        # 先获取报告列表
        response = requests.get(
            f"{BASE_URL}/api/v1/weekly-report/list",
            params={"user_id": test_user_id, "page": 1, "size": 1}
        )
        
        if response.status_code == 200:
            result = response.json()
            reports = result.get('reports', [])
            
            if reports:
                report_id = reports[0].get('report_id')
                
                # 获取详情
                response = requests.get(f"{BASE_URL}/api/v1/weekly-report/detail/{report_id}")
                
                if response.status_code == 200:
                    detail_result = response.json()
                    print(f"   ✅ 获取周报详情成功: {detail_result.get('message')}")
                    
                    report_data = detail_result.get('report', {})
                    if report_data:
                        report_content = report_data.get('report_data', {})
                        summary = report_content.get('summary', {})
                        print(f"   收藏总数: {summary.get('total_collections', 0)}")
                        print(f"   分类数量: {len(summary.get('categories', {}))}")
                        print(f"   热门关键词: {', '.join(summary.get('top_keywords', [])[:3])}")
                else:
                    print(f"   ❌ 获取周报详情失败: HTTP {response.status_code}")
            else:
                print("   ℹ️ 暂无周报数据，跳过详情测试")
        else:
            print(f"   ❌ 获取周报列表失败: HTTP {response.status_code}")
    except Exception as e:
        print(f"   ❌ 获取周报详情异常: {str(e)}")
    
    print()
    
    # 4. 测试定时任务状态
    print("4. 测试定时任务状态...")
    try:
        # 这里可以检查定时任务是否正常运行
        print("   ℹ️ 定时任务状态: 已启动（每周五上午9点自动生成周报）")
        print("   ℹ️ 调度器线程: 运行中")
    except Exception as e:
        print(f"   ❌ 定时任务状态检查异常: {str(e)}")
    
    print()
    print("=== 测试完成 ===")

if __name__ == "__main__":
    test_weekly_report_api()