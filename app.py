import os
from dotenv import load_dotenv
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import HTMLResponse
from routes.auth_routes import router as auth_router
from routes.collection_routes import router as collection_router
from routes.wechat_routes import router as wechat_router
import socket

# 加载环境变量
load_dotenv()

app = FastAPI(title="AI书签收藏助手", version="1.0.0")

# 添加CORS中间件
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # 在生产环境中应限制为特定域名
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 注册路由
app.include_router(auth_router)
app.include_router(collection_router)
app.include_router(wechat_router)


def get_local_ip():
    """获取本地IP地址"""
    try:
        s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
        s.connect(("8.8.8.8", 80))
        ip = s.getsockname()[0]
        s.close()
        return ip
    except Exception:
        return "127.0.0.1"



@app.get("/docs")
async def swagger_ui():
    """API文档页面"""
    return HTMLResponse(content="""
    <!DOCTYPE html>
    <html>
    <head>
        <title>AI书签收藏助手 - API文档</title>
        <style>
            body {{ 
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
                margin: 0;
                padding: 20px;
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                min-height: 100vh;
                color: white;
            }}
            .container {{ 
                max-width: 800px; 
                margin: 0 auto; 
                background: white; 
                padding: 30px; 
                border-radius: 12px; 
                color: #333;
                box-shadow: 0 10px 30px rgba(0,0,0,0.2);
            }}
            h1 {{ color: #4a90e2; text-align: center; }}
            .endpoint {{ 
                background: #f8f9fa; 
                padding: 15px; 
                margin: 10px 0; 
                border-radius: 8px; 
                border-left: 4px solid #4a90e2; 
            }}
            .method {{ 
                display: inline-block; 
                padding: 3px 8px; 
                background: #4a90e2; 
                color: white; 
                border-radius: 4px; 
                font-weight: bold; 
                margin-right: 10px; 
            }}
            .auth-section {{ 
                background: #e8f4fd; 
                padding: 15px; 
                margin: 20px 0; 
                border-radius: 8px; 
                border-left: 4px solid #07c160; 
            }}
        </style>
    </head>
    <body>
        <div class="container">
            <h1>📚 AI书签收藏助手 - API文档</h1>
            
            <h2>欢迎使用AI书签收藏助手API</h2>
            <p>这是一个智能化的内容收藏与管理系统，支持AI分析、关键词提取等功能。</p>
            
            <div class="auth-section">
                <h3>🔐 身份认证</h3>
                <p>系统支持用户身份认证，测试账户：</p>
                <ul>
                    <li>用户名: <strong>test</strong>, 密码: <strong>test123</strong></li>
                    <li>用户名: <strong>admin</strong>, 密码: <strong>admin123</strong></li>
                </ul>
            </div>
            
            <h3>📋 API端点</h3>
            
            <div class="endpoint">
                <span class="method">POST</span>
                <strong>/api/v1/auth/login</strong>
                <p>用户登录接口，获取访问令牌</p>
                <p><strong>请求体:</strong> {"username": "string", "password": "string"}</p>
                <p><strong>响应:</strong> {"success": true, "message": "string", "user_id": "string", "token": "string"}</p>
            </div>
            
            <div class="endpoint">
                <span class="method">POST</span>
                <strong>/api/v1/collect</strong>
                <p>收藏内容接口，提交文本内容进行AI分析</p>
                <p><strong>请求体:</strong> {"user_id": "string", "original_text": "string", "title": "string", "source_url": "string"}</p>
                <p><strong>响应:</strong> {"success": true, "message": "string", "collection_id": "string"}</p>
            </div>
            
            <div class="endpoint">
                <span class="method">GET</span>
                <strong>/api/v1/collections</strong>
                <p>获取收藏列表</p>
                <p><strong>响应:</strong> {"success": true, "collections": [...], "total": 0}</p>
            </div>
            
            <div class="endpoint">
                <span class="method">GET</span>
                <strong>/api/v1/collections/{collection_id}</strong>
                <p>获取特定收藏详情</p>
            </div>
            
            <div class="endpoint">
                <span class="method">DELETE</span>
                <strong>/api/v1/collections/{collection_id}</strong>
                <p>删除特定收藏</p>
            </div>
            
            <div class="endpoint">
                <span class="method">PUT</span>
                <strong>/api/v1/collections/{collection_id}</strong>
                <p>更新特定收藏</p>
            </div>
            
            <h3>🌐 页面访问</h3>
            <ul>
                <li><a href="/">首页</a> - 主要功能入口</li>
                <li><a href="/mobile">移动端页面</a> - 适配移动设备的界面</li>
                <li><a href="/wechat">微信页面</a> - 专为微信内置浏览器优化的界面</li>
                <li><a href="/my-collections">我的收藏</a> - 查看和管理收藏内容</li>
            </ul>
            
            <h3>💡 使用说明</h3>
            <p>1. 访问首页或移动端页面开始使用</p>
            <p>2. 使用Chrome扩展或直接粘贴内容进行收藏</p>
            <p>3. 登录后可查看和管理收藏内容</p>
            
            <h3>📞 技术支持</h3>
            <p>如需技术支持或有问题反馈，请联系开发者。</p>
        </div>
    </body>
    </html>
    """)


@app.get("/health")
async def health_check():
    """健康检查端点"""
    return {"status": "healthy", "service": "AI书签收藏助手", "version": "1.0.0"}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)