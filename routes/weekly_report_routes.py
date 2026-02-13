#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
周报功能API路由
"""

from fastapi import APIRouter, HTTPException
from datetime import datetime, timedelta
from typing import Optional
import uuid

from models import (
    WeeklyReportRequest, 
    WeeklyReportResponse, 
    WeeklyReportListResponse,
    WeeklyReportDetailResponse
)

# 延迟导入周报生成器，避免循环依赖
weekly_report_generator = None

def get_weekly_report_generator():
    """获取周报生成器实例"""
    global weekly_report_generator
    if weekly_report_generator is None:
        from weekly_report import weekly_report_generator as generator
        weekly_report_generator = generator
    return weekly_report_generator

router = APIRouter()

# 临时存储周报数据（实际应使用数据库）
weekly_reports_storage = []


def get_current_week_range():
    """获取当前周的日期范围"""
    today = datetime.now()
    # 周一为每周的第一天
    start_of_week = today - timedelta(days=today.weekday())
    end_of_week = start_of_week + timedelta(days=6)
    
    return start_of_week.strftime('%Y-%m-%d'), end_of_week.strftime('%Y-%m-%d')


def get_week_range_for_date(date_str: str):
    """获取指定日期所在周的日期范围"""
    date = datetime.fromisoformat(date_str)
    start_of_week = date - timedelta(days=date.weekday())
    end_of_week = start_of_week + timedelta(days=6)
    
    return start_of_week.strftime('%Y-%m-%d'), end_of_week.strftime('%Y-%m-%d')


@router.post("/api/v1/weekly-report/generate", response_model=WeeklyReportResponse)
async def generate_weekly_report(request: WeeklyReportRequest):
    """生成周报"""
    try:
        # 检查是否已存在周报
        existing_report = None
        for report in weekly_reports_storage:
            if (report['user_id'] == request.user_id and 
                report['week_start'] == request.week_start and 
                report['week_end'] == request.week_end):
                existing_report = report
                break
        
        # 如果已存在且不强制重新生成，则返回现有报告
        if existing_report and not request.force_regenerate:
            return WeeklyReportResponse(
                success=True,
                message="周报已存在",
                report_id=existing_report['report_id'],
                report_data=existing_report['report_data'],
                generated_at=existing_report['generated_at']
            )
        
        # 获取周报生成器实例
        generator = get_weekly_report_generator()
        
        # 生成周报
        success, report_content, message = generator.generate_weekly_report(
            request.user_id, request.week_start, request.week_end
        )
        
        if not success:
            return WeeklyReportResponse(success=False, message=message)
        
        # 创建周报记录
        report_id = f"weekly_{uuid.uuid4()}"
        generated_at = datetime.now().isoformat() + "Z"
        
        report_record = {
            "report_id": report_id,
            "user_id": request.user_id,
            "week_start": request.week_start,
            "week_end": request.week_end,
            "report_data": report_content.dict(),
            "generated_at": generated_at,
            "created_at": generated_at
        }
        
        # 如果已存在，更新记录；否则新增
        if existing_report:
            existing_report.update(report_record)
        else:
            weekly_reports_storage.append(report_record)
        
        return WeeklyReportResponse(
            success=True,
            message=message,
            report_id=report_id,
            report_data=report_content,
            generated_at=generated_at
        )
        
    except Exception as e:
        return WeeklyReportResponse(
            success=False,
            message=f"生成周报失败: {str(e)}"
        )


@router.get("/api/v1/weekly-report/list")
async def get_weekly_reports(
    user_id: str,
    page: int = 1,
    size: int = 10
):
    """获取周报列表"""
    try:
        # 获取当前周的日期范围
        today = datetime.now()
        week_start = today - timedelta(days=today.weekday())
        week_end = week_start + timedelta(days=6)
        week_start_str = week_start.strftime('%Y-%m-%d')
        week_end_str = week_end.strftime('%Y-%m-%d')
        
        # 过滤用户周报
        user_reports = [
            report for report in weekly_reports_storage 
            if report['user_id'] == user_id
        ]
        
        # 分页
        start_idx = (page - 1) * size
        end_idx = start_idx + size
        paginated_reports = user_reports[start_idx:end_idx]
        
        # 查找当前周报
        current_week_report = None
        for report in user_reports:
            if report['week_start'] == week_start_str and report['week_end'] == week_end_str:
                current_week_report = report
                break
        
        return {
            "success": True,
            "message": "获取周报列表成功",
            "reports": paginated_reports,
            "current_week_report": current_week_report,
            "total": len(user_reports),
            "page": page,
            "size": size
        }
        
    except Exception as e:
        return {
            "success": False,
            "message": f'获取周报列表失败: {str(e)}',
            "reports": [],
            "current_week_report": None,
            "total": 0,
            "page": page,
            "size": size
        }


@router.get("/api/v1/weekly-report/detail/{report_id}", response_model=dict)
async def get_weekly_report_detail(report_id: str):
    """获取周报详情"""
    try:
        # 查找周报
        report = None
        for r in weekly_reports_storage:
            if r['report_id'] == report_id:
                report = r
                break
        
        if not report:
            return {
                'success': False,
                'message': '周报不存在',
                'report': None,
                'collections': []
            }
        
        # 获取周报生成器实例
        generator = get_weekly_report_generator()
        
        # 获取该周报对应的收藏内容
        collections = generator.get_weekly_collections(
            report['user_id'], 
            report['week_start'], 
            report['week_end']
        )
        
        return {
            'success': True,
            'message': '获取周报详情成功',
            'report': report,
            'collections': collections
        }
        
    except Exception as e:
        return {
            'success': False,
            'message': f'获取周报详情失败: {str(e)}',
            'report': None,
            'collections': []
        }


@router.get("/api/v1/weekly-report/{report_id}", response_model=WeeklyReportDetailResponse)
async def get_weekly_report_detail(report_id: str):
    """获取周报详情"""
    try:
        # 查找周报
        report = None
        for r in weekly_reports_storage:
            if r['report_id'] == report_id:
                report = r
                break
        
        if not report:
            raise HTTPException(status_code=404, detail="周报不存在")
        
        # 获取周报生成器实例
        generator = get_weekly_report_generator()
        
        # 获取关联的收藏内容（简化实现）
        collections = generator.get_weekly_collections(
            report['user_id'], report['week_start'], report['week_end']
        )
        
        return WeeklyReportDetailResponse(
            success=True,
            report=report,
            collections=collections
        )
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"获取周报详情失败: {str(e)}")


@router.post("/api/v1/weekly-report/current/generate")
async def generate_current_week_report(user_id: str):
    """生成当前周报"""
    try:
        week_start, week_end = get_current_week_range()
        
        request = WeeklyReportRequest(
            user_id=user_id,
            week_start=week_start,
            week_end=week_end
        )
        
        return await generate_weekly_report(request)
        
    except Exception as e:
        return WeeklyReportResponse(
            success=False,
            message=f"生成当前周报失败: {str(e)}"
        )


@router.delete("/api/v1/weekly-report/{report_id}")
async def delete_weekly_report(report_id: str):
    """删除周报"""
    try:
        global weekly_reports_storage
        
        # 查找并删除周报
        original_length = len(weekly_reports_storage)
        weekly_reports_storage = [
            r for r in weekly_reports_storage 
            if r['report_id'] != report_id
        ]
        
        if len(weekly_reports_storage) == original_length:
            raise HTTPException(status_code=404, detail="周报不存在")
        
        return {"success": True, "message": "周报删除成功"}
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"删除周报失败: {str(e)}")