# Chrome 扩展登录问题修复指南

## 🎯 问题描述
Chrome 扩展登录时提示"无法连接到服务器，请检查后端服务是否正在运行 (http://localhost:8000)"

## 🔍 问题分析

### 根本原因
1. **端口配置错误**：Chrome 扩展配置文件中 API 地址设置为 `http://localhost:8001`
2. **后端服务端口**：后端服务实际运行在 `http://localhost:8000`
3. **错误消息不一致**：错误信息中的 URL 与配置文件中的 URL 不匹配

### 已修复的问题
✅ **端口配置已修正**：将 `config.js` 中的 API 地址从 `8001` 改为 `8000`
✅ **错误消息已统一**：将所有硬编码的 `localhost:8000` 改为动态 `currentApiUrl`
✅ **后端服务已重启**：确保服务正常运行

## 🛠️ 修复步骤

### 1. 配置修复
- **文件**: `chrome-extension/config.js`
- **修改**: 将 `apiUrl: 'http://localhost:8001'` 改为 `apiUrl: 'http://localhost:8000'`

### 2. 错误消息优化
- **文件**: `chrome-extension/background.js`
- **修改**: 将所有错误消息中的硬编码 URL 替换为动态变量

### 3. 后端服务验证
- **服务状态**: ✅ 正常运行
- **端口**: 8000
- **测试命令**: `python test_backend.py`

## 📋 验证步骤

### 1. 后端服务检查
```bash
# 测试后端服务
python test_backend.py
```

### 2. Chrome 扩展测试
1. 打开 Chrome 扩展的开发者工具
2. 在控制台中运行测试脚本：
```javascript
// 复制 test_connection.js 中的代码到控制台运行
testChromeExtensionConnection();
```

### 3. 手动测试登录
1. 点击 Chrome 扩展图标
2. 输入测试账号：
   - 用户名: `test`
   - 密码: `test123`
3. 点击登录按钮

## 🔧 配置说明

### 当前配置
```javascript
// config.js
const Config = {
  development: {
    apiUrl: 'http://localhost:8000',  // ✅ 正确端口
    name: 'Development'
  },
  production: {
    apiUrl: 'https://ai-bookmark-production.up.railway.app',
    name: 'Production'
  }
};
```

### 网络权限
```json
// manifest.json
"host_permissions": [
  "http://localhost:8000/*",
  "http://127.0.0.1:8000/*",
  "https://ai-bookmark-production.up.railway.app/*"
]
```

## 🚀 预期结果

### 成功登录
- ✅ 登录请求成功发送到 `http://localhost:8000/api/v1/auth/login`
- ✅ 返回成功响应：`{"success": true, "token": "..."}`
- ✅ 用户信息和 token 保存到 Chrome 存储
- ✅ 跳转到主界面

### 失败情况排查
如果仍然失败，请检查：

1. **后端服务状态**
   ```bash
   # 检查端口监听
   netstat -an | findstr :8000
   ```

2. **Chrome 扩展权限**
   - 确保扩展已启用必要的网络权限
   - 检查是否有防火墙阻止连接

3. **浏览器控制台错误**
   - 打开 Chrome 扩展的开发者工具
   - 查看 Network 标签页的请求详情
   - 检查 Console 标签页的错误信息

4. **CORS 问题**
   - 后端已配置 CORS 允许所有来源
   - 检查响应头是否包含 `Access-Control-Allow-Origin: *`

## 📞 支持

如果问题仍然存在，请提供以下信息：
1. Chrome 扩展控制台中的完整错误信息
2. 后端服务的运行日志
3. 浏览器版本和操作系统信息
4. 网络请求的详细响应（状态码、响应体）