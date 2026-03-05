# 本地测试服务器 - 使用说明

## 🚀 快速开始

当Railway服务出现502错误时，可以使用这个本地测试服务器来验证Chrome扩展的修复是否有效。

## 📋 前提条件

确保已安装Node.js和npm：
```bash
node --version
npm --version
```

## 📦 安装依赖

```bash
npm install express cors
```

## 🎯 启动服务器

```bash
node local-test-server.js
```

服务器启动后，您将看到：
```
🚀 本地测试服务器已启动
📡 服务器地址: http://localhost:8000
🔗 API地址: http://localhost:8000/api/v1
🏥 健康检查: http://localhost:8000/health

📋 可用接口:
  POST /api/v1/auth/login - 用户登录
  POST /api/v1/collect - 文本收藏
  GET  /api/v1/collections - 收藏列表
  GET  /api/v1/weekly-report/:user_id - 生成周报
  GET  /api/v1/search - 搜索收藏

👤 测试账号:
  用户名: test
  密码: test123
  Token: test-token-12345
```

## 🔧 配置Chrome扩展

### 步骤1: 修改扩展配置
编辑 `chrome-extension/config.js`：

```javascript
// 将生产环境临时改为开发环境
const CURRENT_ENV = 'development'; // 临时修改
```

### 步骤2: 重新加载扩展
1. 打开Chrome浏览器
2. 访问 `chrome://extensions/`
3. 找到"AI书签收藏助手"
4. 点击"重新加载"

### 步骤3: 测试登录
1. 点击扩展图标
2. 使用测试账号登录：
   - 用户名: `test`
   - 密码: `test123`
3. 验证是否能够成功登录

## 🧪 测试API接口

### 测试健康检查
```bash
curl http://localhost:8000/health
```

### 测试登录
```bash
curl -X POST http://localhost:8000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"test","password":"test123"}'
```

### 测试收藏功能
```bash
curl -X POST http://localhost:8000/api/v1/collect \
  -H "Content-Type: application/json" \
  -d '{
    "user_id": 1,
    "original_text": "这是一个测试文本，用于验证Chrome扩展的收藏功能。",
    "url": "https://example.com/test",
    "title": "测试页面",
    "source": "chrome-extension"
  }'
```

### 测试收藏列表
```bash
curl "http://localhost:8000/api/v1/collections?user_id=1&page=1&size=10"
```

## 🔍 验证修复效果

### 测试项目
1. ✅ **用户登录** - 验证登录流程是否正常
2. ✅ **文本收藏** - 测试选中文本收藏功能
3. ✅ **收藏列表** - 验证收藏内容是否正确显示
4. ✅ **右键菜单** - 测试右键收藏功能
5. ✅ **通知功能** - 验证收藏成功的通知
6. ✅ **错误处理** - 测试错误提示是否友好

### 成功指标
- 用户能够成功登录（test/test123）
- 文本收藏功能正常工作
- 收藏列表正确显示
- 所有错误都有友好的提示
- 网络超时处理正常

## 📊 对比测试

### 本地服务器 vs Railway生产环境

| 功能 | 本地服务器 | Railway生产环境 |
|------|------------|-----------------|
| 响应时间 | < 100ms | 通常1-3秒 |
| 可用性 | 100%（本地） | 可能有停机时间 |
| 数据持久性 | 临时数据 | 永久存储 |
| AI分析 | 模拟数据 | 真实AI分析 |
| 适用场景 | 开发和测试 | 生产使用 |

## 🎯 测试完成后的步骤

### 如果本地测试通过
1. ✅ 确认Chrome扩展修复有效
2. ✅ 记录测试结果
3. ✅ 等待Railway服务恢复
4. ✅ 切换回生产环境配置

### 如果本地测试失败
1. ❌ 检查修复代码是否有问题
2. ❌ 查看控制台错误日志
3. ❌ 重新检查代码逻辑
4. ❌ 修复问题后重新测试

## 🔄 切换回生产环境

当Railway服务恢复后：

1. 修改 `chrome-extension/config.js`：
```javascript
const CURRENT_ENV = 'production'; // 切换回生产环境
```

2. 重新加载扩展
3. 测试生产环境是否正常工作

## 📞 支持

如果本地测试服务器有问题：
1. 检查Node.js是否正确安装
2. 确认端口8000没有被占用
3. 查看控制台错误信息
4. 确保所有依赖已安装

---

**用途**: 此本地测试服务器专门用于验证Chrome扩展修复效果，当Railway服务不可用时提供临时的测试环境。