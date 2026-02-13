from fastapi import APIRouter, Depends, HTTPException, Request
from fastapi.responses import JSONResponse
from models import LoginRequest, LoginResponse
from utils import format_response
import secrets

router = APIRouter()

# 模拟用户数据库
users_db = {
    "admin": {"password": "admin123", "user_id": "usr_admin"},
    "test": {"password": "test123", "user_id": "usr_test"}
}


@router.post("/api/v1/auth/login", response_model=LoginResponse)
async def login(req: LoginRequest):
    """用户登录接口"""
    user = users_db.get(req.username)
    
    if not user or user["password"] != req.password:
        return LoginResponse(
            success=False,
            message="用户名或密码错误"
        )
    
    # 生成模拟token
    token = secrets.token_urlsafe(32)
    
    return LoginResponse(
        success=True,
        message="登录成功",
        user_id=user["user_id"],
        token=token
    )


@router.post("/api/v1/auth/logout")
async def logout():
    """用户登出接口"""
    return JSONResponse(
        content=format_response(True, "登出成功")
    )


@router.get("/api/v1/auth/me")
async def get_current_user(request: Request):
    """获取当前用户信息"""
    # 这里只是示例，实际应验证token
    return JSONResponse(
        content=format_response(True, "获取用户信息成功", user_id="usr_default")
    )