#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
定时任务调度系统
实现每周五自动生成周报的功能
"""

import asyncio
import schedule
import time
from datetime import datetime, timedelta
from typing import List
import threading

from weekly_report import weekly_report_generator


class WeeklyReportScheduler:
    """周报定时任务调度器"""
    
    def __init__(self):
        self.is_running = False
        self.scheduler_thread = None
        
    def get_all_users(self) -> List[str]:
        """获取所有用户ID（简化实现）"""
        # 实际应用中应从数据库获取用户列表
        # 这里使用模拟数据
        users = set()
        for collection in weekly_report_generator.collections_storage:
            users.add(collection.get('user_id'))
        return list(users)
    
    def get_previous_week_range(self) -> tuple:
        """获取上一周的日期范围"""
        today = datetime.now()
        # 上周五的日期
        last_friday = today - timedelta(days=(today.weekday() + 3) % 7)
        if last_friday > today:
            last_friday -= timedelta(days=7)
        
        # 上周的开始（周一）和结束（周日）
        week_start = last_friday - timedelta(days=4)  # 上周一
        week_end = last_friday + timedelta(days=2)    # 上周日
        
        return week_start.strftime('%Y-%m-%d'), week_end.strftime('%Y-%m-%d')
    
    def generate_weekly_reports_for_all_users(self):
        """为所有用户生成周报"""
        try:
            print(f"[{datetime.now()}] 开始自动生成周报...")
            
            users = self.get_all_users()
            week_start, week_end = self.get_previous_week_range()
            
            print(f"为 {len(users)} 个用户生成周报，周范围: {week_start} 到 {week_end}")
            
            success_count = 0
            for user_id in users:
                try:
                    success, report_content, message = weekly_report_generator.generate_weekly_report(
                        user_id, week_start, week_end
                    )
                    
                    if success:
                        success_count += 1
                        print(f"用户 {user_id} 周报生成成功")
                    else:
                        print(f"用户 {user_id} 周报生成失败: {message}")
                        
                except Exception as e:
                    print(f"用户 {user_id} 周报生成异常: {str(e)}")
            
            print(f"周报生成完成，成功: {success_count}/{len(users)}")
            
        except Exception as e:
            print(f"自动生成周报失败: {str(e)}")
    
    def schedule_weekly_report(self):
        """安排周报生成任务"""
        # 每周五上午9点生成周报
        schedule.every().friday.at("09:00").do(self.generate_weekly_reports_for_all_users)
        
        # 测试用：每分钟执行一次（开发阶段）
        # schedule.every(1).minutes.do(self.generate_weekly_reports_for_all_users)
        
        print("周报定时任务已安排：每周五上午9点自动生成周报")
    
    def run_scheduler(self):
        """运行调度器"""
        self.is_running = True
        self.schedule_weekly_report()
        
        print("定时任务调度器启动成功")
        
        while self.is_running:
            try:
                schedule.run_pending()
                time.sleep(60)  # 每分钟检查一次
            except Exception as e:
                print(f"调度器运行异常: {str(e)}")
                time.sleep(60)
    
    def start(self):
        """启动调度器（在后台线程中运行）"""
        if self.scheduler_thread and self.scheduler_thread.is_alive():
            print("调度器已在运行")
            return
        
        self.scheduler_thread = threading.Thread(target=self.run_scheduler, daemon=True)
        self.scheduler_thread.start()
        print("周报定时任务调度器已启动")
    
    def stop(self):
        """停止调度器"""
        self.is_running = False
        if self.scheduler_thread:
            self.scheduler_thread.join(timeout=10)
        print("周报定时任务调度器已停止")
    
    def trigger_manual_generation(self, user_id: str = None):
        """手动触发周报生成（测试用）"""
        try:
            if user_id:
                # 为指定用户生成
                week_start, week_end = self.get_previous_week_range()
                success, report_content, message = weekly_report_generator.generate_weekly_report(
                    user_id, week_start, week_end
                )
                
                if success:
                    print(f"手动生成周报成功: {message}")
                    return True, message
                else:
                    print(f"手动生成周报失败: {message}")
                    return False, message
            else:
                # 为所有用户生成
                self.generate_weekly_reports_for_all_users()
                return True, "手动触发周报生成完成"
                
        except Exception as e:
            error_msg = f"手动生成周报失败: {str(e)}"
            print(error_msg)
            return False, error_msg


# 全局调度器实例
weekly_scheduler = WeeklyReportScheduler()


def start_scheduler():
    """启动定时任务调度器"""
    weekly_scheduler.start()


def stop_scheduler():
    """停止定时任务调度器"""
    weekly_scheduler.stop()


def trigger_manual_generation(user_id: str = None):
    """手动触发周报生成"""
    return weekly_scheduler.trigger_manual_generation(user_id)