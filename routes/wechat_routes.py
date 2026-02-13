from fastapi import APIRouter, Request
from fastapi.responses import HTMLResponse
import socket

router = APIRouter()


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


def get_index_page(request: Request = None):
    """获取首页HTML内容"""
    # 获取当前主机名或使用本地IP作为默认值
    if request:
        # 如果有请求对象，则使用请求的主机名
        base_url = request.url.hostname
    else:
        # 否则使用本地IP
        base_url = get_local_ip()
    
    html_content = f'''<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>AI书签收藏助手</title>
  <style>
    * {{
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }}

    body {{
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 20px;
    }}

    .container {{
      max-width: 800px;
      width: 100%;
      background: white;
      border-radius: 16px;
      box-shadow: 0 20px 40px rgba(0,0,0,0.1);
      overflow: hidden;
    }}

    .header {{
      background: #4a90e2;
      color: white;
      padding: 40px 30px;
      text-align: center;
    }}

    .header h1 {{
      font-size: 2.2em;
      margin-bottom: 10px;
      font-weight: 600;
    }}

    .header p {{
      font-size: 1.1em;
      opacity: 0.9;
    }}

    .content {{
      padding: 40px;
    }}

    .features {{
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
      gap: 20px;
      margin: 30px 0;
    }}

    .feature {{
      background: #f8f9fa;
      padding: 20px;
      border-radius: 10px;
      text-align: center;
      transition: transform 0.3s ease;
    }}

    .feature:hover {{
      transform: translateY(-5px);
      background: #e9ecef;
    }}

    .feature-icon {{
      font-size: 2em;
      display: block;
      margin-bottom: 10px;
    }}

    .feature-text {{
      font-weight: 500;
      color: #333;
    }}

    .btn-group {{
      display: flex;
      flex-direction: column;
      gap: 12px;
      margin: 30px 0;
    }}

    .btn {{
      display: inline-block;
      padding: 15px 25px;
      background: #4a90e2;
      color: white;
      text-decoration: none;
      border-radius: 8px;
      text-align: center;
      font-weight: 500;
      transition: background 0.3s ease, transform 0.2s ease;
      border: none;
      cursor: pointer;
      font-size: 1em;
    }}

    .btn:hover {{
      background: #357abd;
      transform: scale(1.02);
    }}

    .btn-primary {{
      background: #28a745;
    }}

    .btn-primary:hover {{
      background: #218838;
    }}

    .btn-secondary {{
      background: #6c757d;
    }}

    .btn-secondary:hover {{
      background: #5a6268;
    }}

    .collection-section {{
      margin: 30px 0;
      padding: 25px;
      background: #f8f9fa;
      border-radius: 10px;
      border: 1px solid #eee;
    }}

    .collection-section h3 {{
      margin-bottom: 15px;
      color: #333;
      font-size: 1.3em;
    }}

    .footer {{
      text-align: center;
      padding: 20px;
      border-top: 1px solid #eee;
      color: #666;
      font-size: 0.9em;
    }}

    @media (max-width: 768px) {{
      .content {{
        padding: 25px 20px;
      }}
      
      .header {{
        padding: 30px 20px;
      }}
      
      .header h1 {{
        font-size: 1.8em;
      }}
    }}
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🔖 AI书签收藏助手</h1>
      <p>智能化内容收藏与管理平台</p>
    </div>
    
    <div class="content">
      <div class="features">
        <div class="feature">
          <span class="feature-icon">🤖</span>
          <span class="feature-text">AI自动分析提取关键词</span>
        </div>
        <div class="feature">
          <span class="feature-icon">⚡</span>
          <span class="feature-text">快速收藏网页内容</span>
        </div>
        <div class="feature">
          <span class="feature-icon">🔒</span>
          <span class="feature-text">安全加密存储</span>
        </div>
        <div class="feature">
          <span class="feature-icon">📱</span>
          <span class="feature-text">多端同步访问</span>
        </div>
      </div>
      
      <div class="btn-group">
        <a href="/docs" class="btn btn-primary">查看API文档</a>
        <a href="javascript:void(0)" class="btn btn-secondary" onclick="alert('Chrome扩展位于项目根目录的chrome-extension文件夹中，按照README.md进行安装')">安装Chrome扩展</a>
      </div>
      
      <div class="collection-section">
        <h3>📝 快速收藏</h3>
        <textarea id="collectionText" placeholder="粘贴您想收藏的内容..." rows="5" style="width: 100%; padding: 12px; border: 1px solid #ddd; border-radius: 6px; margin: 10px 0; font-size: 1em;"></textarea>
        <input type="hidden" id="userId" value="usr_default_user">
        <button onclick="submitCollection()" class="btn btn-primary" style="width: 100%; padding: 14px; font-size: 1em; margin-bottom: 10px;">📤 提交收藏</button>
      </div>
    </div>
    
    <div class="footer">
      <p>访问地址: <span id="currentUrl"></span></p>
    </div>
  </div>
  
  <script>
    async function submitCollection() {{
      const textArea = document.getElementById('collectionText');
      const userIdInput = document.getElementById('userId');
      
      const content = textArea.value.trim();
      
      if (!content) {{
        alert('请输入要收藏的内容');
        return;
      }}
      
      if (content.length < 10) {{
        alert('内容长度至少需要10个字符');
        return;
      }}
      
      const userId = userIdInput.value || 'usr_default_user';
      
      try {{
        // 显示提交中提示
        const submitBtn = document.querySelector('button[onclick="submitCollection()"]');
        const originalText = submitBtn.textContent;
        submitBtn.textContent = '提交中...';
        submitBtn.disabled = true;
        
        // 使用相对路径避免跨域问题，提高微信内置浏览器兼容性
        const response = await fetch('/api/v1/collect', {{
          method: 'POST',
          headers: {{
            'Content-Type': 'application/json',
          }},
          body: JSON.stringify({{
            user_id: userId,
            original_text: content
          }})
        }});
        
        const result = await response.json();
        
        if (result.success) {{
          alert('收藏成功！内容已提交AI分析');
          textArea.value = ''; // 清空输入框
        }} else {{
          alert('收藏失败: ' + (result.message || '未知错误')); 
        }}
      }} catch (error) {{
        console.error('提交收藏时出错:', error);
        // 在微信内置浏览器中提供更友好的错误信息
        alert('提交失败: ' + (error.message || '网络错误，请稍后重试'));
      }} finally {{
        // 恢复按钮状态
        const submitBtn = document.querySelector('button[onclick="submitCollection()"]');
        submitBtn.textContent = '📤 提交收藏';
        submitBtn.disabled = false;
      }}
    }}
  </script>
  
  <script>
    // 动态显示当前访问的URL
    document.addEventListener('DOMContentLoaded', function() {{
      const currentUrlSpan = document.getElementById('currentUrl');
      if(currentUrlSpan) {{
        currentUrlSpan.textContent = window.location.href;
      }}
      
      const currentUrlMobileSpan = document.getElementById('currentUrlMobile');
      if(currentUrlMobileSpan) {{
        currentUrlMobileSpan.textContent = window.location.href;
      }}
    }});
  </script>
</body>
</html>
    '''
    return HTMLResponse(content=html_content)


def get_mobile_page(request: Request = None):
    """获取移动端页面HTML内容"""
    # 获取当前主机名或使用本地IP作为默认值
    if request:
        # 如果有请求对象，则使用请求的主机名
        base_url = request.url.hostname
    else:
        # 否则使用本地IP
        base_url = get_local_ip()
    
    html_content = f'''<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>AI书签收藏助手 - 移动端</title>
  <style>
    * {{
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }}

    body {{
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      background-color: #f5f5f5;
      min-height: 100vh;
      padding: 15px;
    }}

    .container {{
      max-width: 600px;
      margin: 0 auto;
      background: white;
      border-radius: 12px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.1);
      overflow: hidden;
    }}

    .header {{
      background: #4a90e2;
      color: white;
      padding: 25px 20px;
      text-align: center;
    }}

    .header h1 {{
      font-size: 1.8em;
      margin-bottom: 8px;
      font-weight: 600;
    }}

    .header p {{
      font-size: 1em;
      opacity: 0.9;
    }}

    .content {{
      padding: 25px 20px;
    }}

    .feature-list {{
      display: grid;
      grid-template-columns: 1fr;
      gap: 15px;
      margin: 25px 0;
    }}

    .feature-item {{
      display: flex;
      align-items: center;
      padding: 15px;
      background: #f8f9fa;
      border-radius: 8px;
      border-left: 4px solid #4a90e2;
    }}

    .feature-icon {{
      font-size: 1.5em;
      margin-right: 12px;
      width: 30px;
    }}

    .feature-text {{
      font-weight: 500;
      color: #333;
      flex: 1;
    }}

    .btn-group {{
      display: flex;
      flex-direction: column;
      gap: 12px;
      margin: 25px 0;
    }}

    .btn {{
      display: inline-block;
      padding: 15px 20px;
      background: #4a90e2;
      color: white;
      text-decoration: none;
      border-radius: 8px;
      text-align: center;
      font-weight: 500;
      transition: background 0.3s ease;
      border: none;
      cursor: pointer;
      font-size: 1em;
    }}

    .btn:hover {{
      background: #357abd;
    }}

    .btn-primary {{
      background: #28a745;
    }}

    .btn-primary:hover {{
      background: #218838;
    }}

    .btn-secondary {{
      background: #6c757d;
    }}

    .btn-secondary:hover {{
      background: #5a6268;
    }}

    .collection-section {{
      margin: 25px 0;
      padding: 20px;
      background: #f8f9fa;
      border-radius: 8px;
      border: 1px solid #eee;
    }}

    .collection-section h3 {{
      margin: 0 0 15px 0;
      color: #333;
      font-size: 1.2em;
    }}

    .info-section {{
      margin: 25px 0;
      padding: 20px;
      background: #e8f4fd;
      border-radius: 8px;
      border: 1px solid #b8dae8;
    }}

    .info-title {{
      font-weight: 600;
      margin-bottom: 12px;
      color: #07c160;
      display: flex;
      align-items: center;
    }}

    .info-title::before {{
      content: "ℹ️ ";
      margin-right: 5px;
    }}

    .info-item {{
      padding: 6px 0;
      font-size: 0.95em;
      color: #555;
      display: flex;
      align-items: flex-start;
    }}

    .info-item::before {{
      content: "• ";
      margin-right: 8px;
      color: #07c160;
      flex-shrink: 0;
    }}

    .highlight {{
      background: #fff3cd;
      padding: 2px 6px;
      border-radius: 4px;
      font-weight: 500;
      color: #856404;
    }}

    .footer {{
      text-align: center;
      padding: 20px;
      border-top: 1px solid #eee;
      color: #666;
      font-size: 0.9em;
      background: #f8f9fa;
    }}

    @media (max-width: 600px) {{
      .content {{
        padding: 20px 15px;
      }}
    }}
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>📱 移动收藏助手</h1>
      <p>随时随地收藏重要内容</p>
    </div>
    
    <div class="content">
      <div class="feature-list">
        <div class="feature-item">
          <span class="feature-icon">🚀</span>
          <span class="feature-text">快速收藏网页内容</span>
        </div>
        <div class="feature-item">
          <span class="feature-icon">🤖</span>
          <span class="feature-text">AI自动分析提取关键词</span>
        </div>
        <div class="feature-item">
          <span class="feature-icon">🌐</span>
          <span class="feature-text">支持微信公众号文章</span>
        </div>
        <div class="feature-item">
          <span class="feature-icon">📱</span>
          <span class="feature-text">多端同步访问</span>
        </div>
      </div>
      
      <div class="btn-group">
        <a href="/docs" class="btn btn-primary">查看API文档</a>
        <a href="javascript:void(0)" class="btn btn-secondary" onclick="alert('Chrome扩展位于项目根目录的chrome-extension文件夹中，按照README.md进行安装')">安装Chrome扩展</a>
      </div>
      
      <div class="collection-section">
        <h3>📝 快速收藏</h3>
        <textarea id="collectionText" placeholder="粘贴您想收藏的内容..." rows="5" style="width: 100%; padding: 12px; border: 1px solid #ddd; border-radius: 6px; margin: 10px 0; font-size: 1em;"></textarea>
        <input type="hidden" id="userId" value="usr_mobile_user">
        <button onclick="submitCollection()" class="btn btn-primary" style="width: 100%; padding: 14px; font-size: 1em; margin-bottom: 10px;">📤 提交收藏</button>
      </div>
      
      <div class="info-section">
        <div class="info-title">使用说明</div>
        <div class="info-item">1. 确保设备与服务在同一网络</div>
        <div class="info-item">2. 访问地址: <span class="highlight"><span id="currentUrlMobile"></span></span></div>
        <div class="info-item">3. 测试账号: test / test123</div>
        <div class="info-item">4. 查看收藏内容和AI分析</div>
      </div>
    </div>
    
    <div class="footer">
      <p>将此页面添加到主屏幕以便快速访问</p>
    </div>
  </div>
  
  <script>
    async function submitCollection() {{
      const textArea = document.getElementById('collectionText');
      const userIdInput = document.getElementById('userId');
      
      const content = textArea.value.trim();
      
      if (!content) {{
        alert('请输入要收藏的内容');
        return;
      }}
      
      if (content.length < 10) {{
        alert('内容长度至少需要10个字符');
        return;
      }}
      
      const userId = userIdInput.value || 'usr_mobile_user';
      
      try {{
        // 显示提交中提示
        const submitBtn = document.querySelector('button[onclick="submitCollection()"]');
        const originalText = submitBtn.textContent;
        submitBtn.textContent = '提交中...';
        submitBtn.disabled = true;
        
        // 使用相对路径避免跨域问题，提高微信内置浏览器兼容性
        const response = await fetch('/api/v1/collect', {{
          method: 'POST',
          headers: {{
            'Content-Type': 'application/json',
          }},
          body: JSON.stringify({{
            user_id: userId,
            original_text: content
          }})
        }});
        
        const result = await response.json();
        
        if (result.success) {{
          alert('收藏成功！内容已提交AI分析');
          textArea.value = ''; // 清空输入框
        }} else {{
          alert('收藏失败: ' + (result.message || '未知错误'));
        }}
      }} catch (error) {{
        console.error('提交收藏时出错:', error);
        // 在微信内置浏览器中提供更友好的错误信息
        alert('提交失败: ' + (error.message || '网络错误，请稍后重试'));
      }} finally {{
        // 恢复按钮状态
        const submitBtn = document.querySelector('button[onclick="submitCollection()"]');
        submitBtn.textContent = '📤 提交收藏';
        submitBtn.disabled = false;
      }}
    }}
  </script>
  
  <script>
    // 动态显示当前访问的URL
    document.addEventListener('DOMContentLoaded', function() {{
      const currentUrlSpan = document.getElementById('currentUrl');
      if(currentUrlSpan) {{
        currentUrlSpan.textContent = window.location.href;
      }}
      
      const currentUrlMobileSpan = document.getElementById('currentUrlMobile');
      if(currentUrlMobileSpan) {{
        currentUrlMobileSpan.textContent = window.location.href;
      }}
    }});
  </script>
</body>
</html>
    '''
    return HTMLResponse(content=html_content)


def get_wechat_page(request: Request = None):
    """获取微信页面HTML内容"""
    # 获取当前主机名或使用本地IP作为默认值
    if request:
        # 如果有请求对象，则使用请求的主机名
        base_url = request.url.hostname
    else:
        # 否则使用本地IP
        base_url = get_local_ip()
    
    html_content = f'''<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>AI书签收藏助手 - 微信版</title>
  <style>
    * {{
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }}

    body {{
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      background: linear-gradient(135deg, #1e3c72 0%, #2a5298 100%);
      min-height: 100vh;
      padding: 15px;
    }}

    .container {{
      max-width: 600px;
      margin: 0 auto;
      background: white;
      border-radius: 12px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.1);
      overflow: hidden;
    }}

    .header {{
      background: #07c160;
      color: white;
      padding: 25px 20px;
      text-align: center;
    }}

    .header h1 {{
      font-size: 1.8em;
      margin-bottom: 8px;
      font-weight: 600;
    }}

    .header p {{
      font-size: 1em;
      opacity: 0.9;
    }}

    .content {{
      padding: 25px 20px;
    }}

    .warning {{
      background: #fff3cd;
      border: 1px solid #ffeaa7;
      border-radius: 8px;
      padding: 15px;
      margin: 20px 0;
      text-align: center;
    }}

    .warning p:first-child {{
      font-weight: 600;
      color: #856404;
      margin-bottom: 5px;
    }}

    .warning p:last-child {{
      color: #856404;
      font-size: 0.9em;
      margin: 0;
    }}

    .feature-list {{
      display: grid;
      grid-template-columns: 1fr;
      gap: 15px;
      margin: 25px 0;
    }}

    .feature-item {{
      display: flex;
      align-items: center;
      padding: 15px;
      background: #f8f9fa;
      border-radius: 8px;
      border-left: 4px solid #07c160;
    }}

    .feature-icon {{
      font-size: 1.5em;
      margin-right: 12px;
      width: 30px;
    }}

    .feature-text {{
      font-weight: 500;
      color: #333;
      flex: 1;
    }}

    .btn-group {{
      display: flex;
      flex-direction: column;
      gap: 12px;
      margin: 25px 0;
    }}

    .btn {{
      display: inline-block;
      padding: 15px 20px;
      background: #4a90e2;
      color: white;
      text-decoration: none;
      border-radius: 8px;
      text-align: center;
      font-weight: 500;
      transition: background 0.3s ease;
      border: none;
      cursor: pointer;
      font-size: 1em;
    }}

    .btn:hover {{
      background: #357abd;
    }}

    .btn-primary {{
      background: #07c160;
    }}

    .btn-primary:hover {{
      background: #06ac55;
    }}

    .btn-secondary {{
      background: #6c757d;
    }}

    .btn-secondary:hover {{
      background: #5a6268;
    }}

    .collection-form {{
      margin: 25px 0;
      padding: 20px;
      background: #f9f9f9;
      border-radius: 8px;
      border: 1px solid #eee;
    }}

    .collection-form h3 {{
      margin: 0 0 15px 0;
      color: #333;
      font-size: 1.2em;
    }}

    .info-section {{
      margin: 25px 0;
      padding: 20px;
      background: #e8f4fd;
      border-radius: 8px;
      border: 1px solid #b8dae8;
    }}

    .info-title {{
      font-weight: 600;
      margin-bottom: 10px;
      color: #333;
      display: flex;
      align-items: center;
    }}

    .info-title::before {{
      content: "ℹ️ ";
      margin-right: 5px;
    }}

    .info-item {{
      padding: 5px 0;
      font-size: 0.95em;
      color: #555;
      display: flex;
      align-items: flex-start;
    }}

    .info-item::before {{
      content: "• ";
      margin-right: 5px;
      color: #07c160;
    }}

    .footer {{
      text-align: center;
      padding: 20px;
      border-top: 1px solid #eee;
      color: #666;
      font-size: 0.9em;
    }}

    @media (max-width: 600px) {{
      .content {{
        padding: 20px 15px;
      }}
    }}
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>📱 微信收藏助手</h1>
      <p>AI驱动的智能收藏服务</p>
    </div>
    
    <div class="content">
      <div class="warning">
        <p>⚠️ 重要提醒</p>
        <p>微信内置浏览器功能受限，请点击右上角选择「在浏览器中打开」</p>
      </div>
      
      <div class="feature-list">
        <div class="feature-item">
          <span class="feature-icon">🌐</span>
          <span class="feature-text">微信公众号文章智能收藏</span>
        </div>
        <div class="feature-item">
          <span class="feature-icon">🤖</span>
          <span class="feature-text">AI自动分析提取关键词</span>
        </div>
        <div class="feature-item">
          <span class="feature-icon">📋</span>
          <span class="feature-text">智能分类与内容摘要</span>
        </div>
        <div class="feature-item">
          <span class="feature-icon">💾</span>
          <span class="feature-text">云端存储与管理</span>
        </div>
      </div>
      
      <div class="btn-group">
        <a href="/" class="btn btn-primary">🏠 返回首页</a>
        <a href="#" onclick="alert('请在微信中点击右上角菜单，选择"在浏览器中打开"以获得完整功能体验')" class="btn btn-secondary">📱 在浏览器中打开</a>
        <a href="/docs" class="btn btn-secondary">📄 API文档</a>
      </div>
      
      <div class="collection-form">
        <h3>📝 快速收藏</h3>
        <textarea id="collectionText" placeholder="在此粘贴您复制的文章内容..." rows="6" style="width: 100%; padding: 12px; border: 1px solid #ddd; border-radius: 6px; margin: 10px 0; font-size: 1em;"></textarea>
        <input type="hidden" id="user_id" value="usr_wechat_user">
        <button onclick="submitCollection()" class="btn btn-primary" style="width: 100%; padding: 14px; font-size: 1em; margin-bottom: 10px;">📤 提交收藏</button>
      </div>
      
      <div class="info-section">
        <div class="info-title">收藏流程</div>
        <div class="info-item">在微信公众号文章中长按选中内容并复制</div>
        <div class="info-item">保存此页面或记录网址方便返回</div>
        <div class="info-item">点击上方按钮前往收藏页面</div>
        <div class="info-item">登录并提交复制的内容完成收藏</div>
      </div>
    </div>
    
    <div class="footer">
      <p>AI书签收藏助手 v1.0</p>
    </div>
  </div>
  
  <script>
    async function submitCollection() {{
      const textArea = document.getElementById('collectionText');
      const userIdInput = document.getElementById('user_id');
      
      const content = textArea.value.trim();
      
      if (!content) {{
        alert('请输入要收藏的内容');
        return;
      }}
      
      if (content.length < 10) {{
        alert('内容长度至少需要10个字符');
        return;
      }}
      
      const userId = userIdInput.value || 'usr_wechat_user';
      
      try {{
        // 显示提交中提示
        const submitBtn = document.querySelector('button[onclick="submitCollection()"]');
        const originalText = submitBtn.textContent;
        submitBtn.textContent = '提交中...';
        submitBtn.disabled = true;
        
        // 使用相对路径避免跨域问题，提高微信内置浏览器兼容性
        const response = await fetch('/api/v1/collect', {{
          method: 'POST',
          headers: {{
            'Content-Type': 'application/json',
          }},
          body: JSON.stringify({{
            user_id: userId,
            original_text: content
          }})
        }});
        
        const result = await response.json();
        
        if (result.success) {{
          alert('收藏成功！内容已提交AI分析');
          textArea.value = ''; // 清空输入框
        }} else {{
          alert('收藏失败: ' + (result.message || '未知错误'));
        }}
      }} catch (error) {{
        console.error('提交收藏时出错:', error);
        // 在微信内置浏览器中提供更友好的错误信息
        alert('提交失败: ' + (error.message || '网络错误，请稍后重试'));
      }} finally {{
        // 恢复按钮状态
        const submitBtn = document.querySelector('button[onclick="submitCollection()"]');
        submitBtn.textContent = '📤 提交收藏';
        submitBtn.disabled = false;
      }}
    }}
  </script>
  
  <script>
    // 动态显示当前访问的URL
    document.addEventListener('DOMContentLoaded', function() {{
      const currentUrlSpan = document.getElementById('currentUrl');
      if(currentUrlSpan) {{
        currentUrlSpan.textContent = window.location.href;
      }}
      
      const currentUrlMobileSpan = document.getElementById('currentUrlMobile');
      if(currentUrlMobileSpan) {{
        currentUrlMobileSpan.textContent = window.location.href;
      }}
    }});
  </script>
</body>
</html>
    '''
    return HTMLResponse(content=html_content)


def get_my_collections_page(request: Request = None):
    """获取我的收藏页面HTML内容"""
    # 获取当前主机名或使用本地IP作为默认值
    if request:
        # 如果有请求对象，则使用请求的主机名
        base_url = request.url.hostname
    else:
        # 否则使用本地IP
        base_url = get_local_ip()
    
    html_content = f'''<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>AI书签收藏助手 - 我的收藏</title>
  <style>
    * {{
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }}

    body {{
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      background-color: #f5f5f5;
      min-height: 100vh;
      padding: 20px;
    }}

    .container {{
      max-width: 1000px;
      margin: 0 auto;
      background: white;
      border-radius: 12px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.1);
      overflow: hidden;
    }}

    .header {{
      background: #4a90e2;
      color: white;
      padding: 25px 20px;
      text-align: center;
    }}

    .header h1 {{
      font-size: 1.8em;
      margin-bottom: 8px;
      font-weight: 600;
    }}

    .header p {{
      font-size: 1em;
      opacity: 0.9;
    }}

    .controls {{
      padding: 20px;
      background: #f8f9fa;
      border-bottom: 1px solid #eee;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }}

    .search-box {{
      flex-grow: 1;
      max-width: 400px;
    }}

    .search-box input {{
      width: 100%;
      padding: 10px 15px;
      border: 1px solid #ddd;
      border-radius: 6px;
      font-size: 1em;
    }}

    .stats {{
      display: flex;
      gap: 20px;
      margin: 20px;
      flex-wrap: wrap;
    }}

    .stat-card {{
      background: white;
      border: 1px solid #e0e0e0;
      border-radius: 8px;
      padding: 15px;
      min-width: 150px;
      text-align: center;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }}

    .stat-number {{
      font-size: 1.8em;
      font-weight: bold;
      color: #4a90e2;
    }}

    .stat-label {{
      font-size: 0.9em;
      color: #666;
      margin-top: 5px;
    }}

    .collections-list {{
      padding: 0 20px 20px;
    }}

    .collection-item {{
      background: white;
      border: 1px solid #e0e0e0;
      border-radius: 8px;
      margin-bottom: 15px;
      overflow: hidden;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }}

    .collection-header {{
      padding: 15px;
      background: #f8f9fa;
      border-bottom: 1px solid #eee;
      cursor: pointer;
    }}

    .collection-header h3 {{
      margin: 0;
      color: #333;
      font-size: 1.1em;
    }}

    .collection-meta {{
      display: flex;
      gap: 15px;
      margin-top: 8px;
      font-size: 0.85em;
      color: #666;
    }}

    .collection-content {{
      padding: 15px;
      display: none;
    }}

    .collection-content.expanded {{
      display: block;
    }}

    .collection-text {{
      line-height: 1.6;
      margin-bottom: 15px;
    }}

    .collection-keywords {{
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
      margin-top: 10px;
    }}

    .keyword-tag {{
      background: #e3f2fd;
      color: #1976d2;
      padding: 4px 10px;
      border-radius: 12px;
      font-size: 0.85em;
    }}

    .actions {{
      display: flex;
      gap: 10px;
      margin-top: 15px;
    }}

    .btn {{
      padding: 8px 15px;
      border: none;
      border-radius: 4px;
      cursor: pointer;
      font-size: 0.9em;
      text-decoration: none;
      display: inline-block;
    }}

    .btn-view {{
      background: #4caf50;
      color: white;
    }}

    .btn-delete {{
      background: #f44336;
      color: white;
    }}

    .btn-edit {{
      background: #ff9800;
      color: white;
    }}

    .loading {{
      text-align: center;
      padding: 40px;
      color: #666;
    }}

    .empty {{
      text-align: center;
      padding: 40px;
      color: #666;
    }}

    .pagination {{
      display: flex;
      justify-content: center;
      gap: 10px;
      margin-top: 20px;
      padding: 0 20px 20px;
    }}

    .page-btn {{
      padding: 8px 15px;
      border: 1px solid #ddd;
      background: white;
      border-radius: 4px;
      cursor: pointer;
    }}

    .page-btn.active {{
      background: #4a90e2;
      color: white;
    }}

    @media (max-width: 768px) {{
      .controls {{
        flex-direction: column;
        gap: 15px;
      }}
      
      .search-box {{
        width: 100%;
      }}
      
      .stats {{
        justify-content: center;
      }}
    }}
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>📚 我的收藏</h1>
      <p>查看和管理您的收藏内容及AI分析结果</p>
    </div>
    
    <div class="controls">
      <div class="search-box">
        <input type="text" id="searchInput" placeholder="搜索收藏内容...">
      </div>
      <div>
        <button class="btn btn-view" onclick="loadCollections()">刷新</button>
      </div>
    </div>
    
    <div class="stats">
      <div class="stat-card">
        <div class="stat-number" id="totalCount">0</div>
        <div class="stat-label">总收藏数</div>
      </div>
      <div class="stat-card">
        <div class="stat-number" id="todayCount">0</div>
        <div class="stat-label">今日新增</div>
      </div>
      <div class="stat-card">
        <div class="stat-number" id="weekCount">0</div>
        <div class="stat-label">本周新增</div>
      </div>
      <div class="stat-card">
        <div class="stat-number" id="avgLength">0</div>
        <div class="stat-label">平均长度(字)</div>
      </div>
    </div>
    
    <div class="collections-list">
      <div id="collectionsContainer">
        <div class="loading">正在加载收藏内容...</div>
      </div>
    </div>
    
    <div class="pagination">
      <button class="page-btn" id="prevPage">上一页</button>
      <span id="pageInfo">1 / 1</span>
      <button class="page-btn" id="nextPage">下一页</button>
    </div>
  </div>
  
  <script>
    let currentPage = 1;
    const pageSize = 10;
    let allCollections = [];
    
    // 加载收藏列表
    async function loadCollections(page = 1) {{
      try {{
        showLoading();
        
        const response = await fetch(`/api/v1/collections?page=${{page}}&size=${{pageSize}}`);
        const result = await response.json();
        
        if (result.success) {{
          allCollections = result.collections || [];
          currentPage = page;
          renderCollections(allCollections);
          updatePagination(result.total || 0);
          updateStats(result.collections || []);
        }} else {{
          showError(result.message || '获取收藏列表失败');
        }}
      }} catch (error) {{
        console.error('加载收藏时出错:', error);
        showError('加载收藏失败: ' + error.message);
      }}
    }}
    
    // 渲染收藏列表
    function renderCollections(collections) {{
      const container = document.getElementById('collectionsContainer');
      
      if (collections.length === 0) {{
        container.innerHTML = '<div class="empty">暂无收藏内容</div>';
        return;
      }}
      
      const html = collections.map(coll => `
        <div class="collection-item">
          <div class="collection-header" onclick="toggleContent(this)">
            <h3>${{coll.title || '未命名收藏'}}</h3>
            <div class="collection-meta">
              <span>👤 用户: ${{coll.user_id}}</span>
              <span>🕒 时间: ${{formatDate(coll.created_at)}}</span>
              <span>⏱️ 阅读时长: ${{coll.reading_time}}分钟</span>
            </div>
          </div>
          <div class="collection-content">
            <div class="collection-text">
              <strong>原文内容:</strong><br>
              ${{truncateText(coll.original_text, 200)}}
            </div>
            
            <div class="collection-keywords">
              <strong>AI提取关键词:</strong>
              ${{renderKeywords(coll.keywords || [])}}
            </div>
            
            <div class="actions">
              <button class="btn btn-view" onclick="viewDetail('${{coll.id}}')">查看详情</button>
              <button class="btn btn-edit" onclick="editCollection('${{coll.id}}')">编辑</button>
              <button class="btn btn-delete" onclick="deleteCollection('${{coll.id}}')">删除</button>
            </div>
          </div>
        </div>
      `).join('');
      
      container.innerHTML = html;
    }}
    
    // 切换内容显示
    function toggleContent(headerElement) {{
      const contentElement = headerElement.nextElementSibling;
      contentElement.classList.toggle('expanded');
    }}
    
    // 显示加载状态
    function showLoading() {{
      document.getElementById('collectionsContainer').innerHTML = '<div class="loading">正在加载收藏内容...</div>';
    }}
    
    // 显示错误
    function showError(message) {{
      document.getElementById('collectionsContainer').innerHTML = `<div class="empty">${{message}}</div>`;
    }}
    
    // 格式化日期
    function formatDate(timestamp) {{
      if (!timestamp) return '';
      const date = new Date(timestamp * 1000);
      return date.toLocaleString('zh-CN');
    }}
    
    // 截断文本
    function truncateText(text, maxLength) {{
      if (!text) return '';
      return text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
    }}
    
    // 渲染关键词
    function renderKeywords(keywords) {{
      if (!keywords || keywords.length === 0) {{
        return '<span class="keyword-tag">暂无关键词</span>';
      }}
      
      return keywords.slice(0, 10).map(keyword => `
        <span class="keyword-tag">${{keyword}}</span>
      `).join('');
    }}
    
    // 更新分页
    function updatePagination(total) {{
      const totalPages = Math.ceil(total / pageSize);
      document.getElementById('pageInfo').textContent = `${{currentPage}} / ${{totalPages || 1}}`;
      
      document.getElementById('prevPage').disabled = currentPage <= 1;
      document.getElementById('nextPage').disabled = currentPage >= totalPages;
    }}
    
    // 更新统计信息
    function updateStats(collections) {{
      document.getElementById('totalCount').textContent = collections.length;
      
      // 计算今日新增
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const todayStart = today.getTime() / 1000;
      
      const todayCount = collections.filter(coll => coll.created_at >= todayStart).length;
      document.getElementById('todayCount').textContent = todayCount;
      
      // 计算本周新增
      const week = new Date();
      week.setDate(week.getDate() - week.getDay());
      week.setHours(0, 0, 0, 0);
      const weekStart = week.getTime() / 1000;
      
      const weekCount = collections.filter(coll => coll.created_at >= weekStart).length;
      document.getElementById('weekCount').textContent = weekCount;
      
      // 计算平均长度
      if (collections.length > 0) {{
        const totalLength = collections.reduce((sum, coll) => sum + (coll.original_text ? coll.original_text.length : 0), 0);
        const avgLength = Math.floor(totalLength / collections.length);
        document.getElementById('avgLength').textContent = avgLength;
      }} else {{
        document.getElementById('avgLength').textContent = '0';
      }}
    }}
    
    // 查看详情
    async function viewDetail(id) {{
      try {{
        const response = await fetch(`/api/v1/collections/${{id}}`);
        const result = await response.json();
        
        if (result.success && result.collection) {{
          alert(`收藏详情:

标题: ${{result.collection.title}}

内容: ${{result.collection.original_text}}

关键词: ${{(result.collection.keywords || []).join(', ')}}`);
        }} else {{
          alert('获取收藏详情失败: ' + (result.message || '未知错误'));
        }}
      }} catch (error) {{
        console.error('获取详情时出错:', error);
        alert('获取详情失败: ' + error.message);
      }}
    }}
    
    // 编辑收藏
    async function editCollection(id) {{
      try {{
        const response = await fetch(`/api/v1/collections/${{id}}`);
        const result = await response.json();
        
        if (result.success && result.collection) {{
          const newText = prompt('编辑收藏内容:', result.collection.original_text);
          if (newText !== null) {{
            const updateResponse = await fetch(`/api/v1/collections/${{id}}`, {{
              method: 'PUT',
              headers: {{
                'Content-Type': 'application/json',
              }},
              body: JSON.stringify({{
                user_id: result.collection.user_id,
                original_text: newText,
                title: result.collection.title,
                source_url: result.collection.source_url
              }})
            }});
            
            const updateResult = await updateResponse.json();
            if (updateResult.success) {{
              alert('更新成功');
              loadCollections(currentPage); // 重新加载当前页
            }} else {{
              alert('更新失败: ' + updateResult.message);
            }}
          }}
        }} else {{
          alert('获取收藏详情失败: ' + (result.message || '未知错误'));
        }}
      }} catch (error) {{
        console.error('编辑收藏时出错:', error);
        alert('编辑失败: ' + error.message);
      }}
    }}
    
    // 删除收藏
    async function deleteCollection(id) {{
      if (confirm('确定要删除这个收藏吗？')) {{
        try {{
          const response = await fetch(`/api/v1/collections/${{id}}`, {{
            method: 'DELETE'
          }});
          
          const result = await response.json();
          if (result.success) {{
            alert('删除成功');
            loadCollections(currentPage); // 重新加载当前页
          }} else {{
            alert('删除失败: ' + result.message);
          }}
        }} catch (error) {{
          console.error('删除收藏时出错:', error);
          alert('删除失败: ' + error.message);
        }}
      }}
    }}
    
    // 页面切换事件
    document.getElementById('prevPage').addEventListener('click', () => {{
      if (currentPage > 1) {{
        loadCollections(currentPage - 1);
      }}
    }});
    
    document.getElementById('nextPage').addEventListener('click', () => {{
      loadCollections(currentPage + 1);
    }});
    
    // 搜索功能
    document.getElementById('searchInput').addEventListener('input', (e) => {{
      const searchTerm = e.target.value.toLowerCase();
      
      if (searchTerm === '') {{
        renderCollections(allCollections);
      }} else {{
        const filtered = allCollections.filter(coll => 
          (coll.title && coll.title.toLowerCase().includes(searchTerm)) ||
          (coll.original_text && coll.original_text.toLowerCase().includes(searchTerm)) ||
          (coll.keywords && coll.keywords.some(k => k.toLowerCase().includes(searchTerm)))
        );
        renderCollections(filtered);
      }}
    }});
    
    // 页面加载时获取收藏列表
    document.addEventListener('DOMContentLoaded', () => {{
      loadCollections();
    }});
  </script>
</body>
</html>
    '''
    return HTMLResponse(content=html_content)


@router.get("/")
async def index_page(request: Request):
    """首页路由"""
    return get_index_page(request=request)


@router.get("/mobile")
async def mobile_page(request: Request):
    """移动端页面路由"""
    return get_mobile_page(request=request)


@router.get("/wechat")
async def wechat_page(request: Request):
    """微信页面路由"""
    response = get_wechat_page(request=request)
    # 设置额外的安全头，帮助微信浏览器正确处理
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-Frame-Options"] = "DENY"
    response.headers["X-XSS-Protection"] = "1; mode=block"
    return response


@router.get("/my-collections")
async def my_collections_page(request: Request):
    """我的收藏页面路由"""
    return get_my_collections_page(request=request)