# AI书签收藏助手 Chrome扩展

一个基于AI的智能书签收藏Chrome浏览器扩展，可以选中网页文本一键收藏，并自动进行AI分析和分类。

## 功能特性

- ✅ 选中文本显示浮动收藏按钮
- ✅ 右键菜单快速收藏
- ✅ 键盘快捷键 (Ctrl+Shift+S)
- ✅ 用户登录认证
- ✅ 查看收藏列表
- ✅ 离线缓存支持
- ✅ AI自动分析和标签提取

## 安装步骤

### 1. 准备图标文件

在 `icons/` 目录下添加以下尺寸的图标：
- icon16.png (16x16)
- icon32.png (32x32)
- icon48.png (48x48)
- icon128.png (128x128)

可以使用书签图标或自定义设计的图标。

### 2. 加载扩展到Chrome

1. 打开Chrome浏览器
2. 地址栏输入：`chrome://extensions/`
3. 打开右上角的"开发者模式"
4. 点击"加载已解压的扩展程序"
5. 选择 `chrome-extension` 文件夹
6. 扩展将被加载并显示在工具栏

### 3. 确保后端API运行

确保后端服务运行在：
- 本地测试：`http://10.81.5.132:8000`
- 或Railway生产：`https://ai-bookmark-production.up.railway.app`

## 使用方法

### 登录
1. 点击扩展图标打开弹窗
2. 使用测试账号登录：
   - 用户名：`test`
   - 密码：`test123`

### 收藏文本
1. **方法一**：选中网页上的文本（至少10个字符），会自动显示浮动收藏按钮，点击即可收藏
2. **方法二**：选中文本后右键，选择"收藏选中内容到AI书签"
3. **方法三**：选中文本后按快捷键 `Ctrl+Shift+S`

### 查看收藏
- 点击扩展图标查看收藏列表
- 显示AI分析的关键词和摘要
- 支持查看原文链接

### 离线支持
- 网络不可用时收藏会保存到离线队列
- 网络恢复后点击同步按钮自动上传

## 文件结构

```
chrome-extension/
├── manifest.json       # 扩展配置文件
├── background.js       # 后台服务脚本（API请求、离线缓存）
├── content.js          # 内容脚本（文本选择、浮动按钮）
├── content.css         # 内容脚本样式
├── popup.html          # 弹窗页面
├── popup.js            # 弹窗逻辑
├── popup.css           # 弹窗样式
├── icons/              # 图标目录
│   ├── icon16.png
│   ├── icon32.png
│   ├── icon48.png
│   └── icon128.png
└── README.md           # 说明文档
```

## API接口

扩展对接以下后端API：

- `POST /api/v1/auth/login` - 用户登录
- `POST /api/v1/collect` - 提交收藏
- `GET /api/v1/collections` - 获取收藏列表

## 开发说明

### 修改API地址

编辑 `background.js` 文件：

```javascript
const API_BASE_URL = 'http://10.81.5.132:8000'; // 本地
// 或
const API_BASE_URL = 'https://ai-bookmark-production.up.railway.app'; // 生产
```

### 调试

1. 在 `chrome://extensions/` 页面点击"检查视图"可以查看background script控制台
2. 在网页上按F12可以查看content script的console.log输出
3. 右键点击扩展图标选择"检查弹出内容"可以调试popup页面

## 注意事项

- 首次安装需要添加图标文件
- 确保后端API运行并可访问
- 部分网站可能阻止内容脚本注入
- 离线队列存储在本地，清除浏览器数据会丢失

## 技术栈

- Manifest V3
- Vanilla JavaScript
- Chrome Extension APIs
- Fetch API
- Chrome Storage API
