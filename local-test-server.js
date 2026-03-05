// 本地测试服务器 - 用于验证Chrome扩展修复
// 这是一个简单的本地服务器，模拟Railway API的行为

const express = require('express');
const cors = require('cors');
const app = express();
const PORT = process.env.PORT || 8000;

// 中间件
app.use(cors());
app.use(express.json());

// 模拟数据库
let collections = [];
let users = [
  { id: 1, username: 'test', password: 'test123', token: 'test-token-12345' }
];

// 健康检查
app.get('/health', (req, res) => {
  res.json({ 
    status: 'healthy', 
    timestamp: new Date().toISOString(),
    environment: 'local-test',
    version: '1.0.0'
  });
});

// 用户登录
app.post('/api/v1/auth/login', (req, res) => {
  const { username, password } = req.body;
  
  console.log('[LOCAL-TEST] 登录请求:', { username, password });
  
  const user = users.find(u => u.username === username && u.password === password);
  
  if (user) {
    res.json({
      success: true,
      data: {
        token: user.token,
        user_id: user.id,
        username: user.username
      },
      message: '登录成功'
    });
  } else {
    res.status(401).json({
      success: false,
      error: '用户名或密码错误'
    });
  }
});

// 文本收藏
app.post('/api/v1/collect', (req, res) => {
  const { user_id, original_text, url, title, source, metadata } = req.body;
  
  console.log('[LOCAL-TEST] 收藏请求:', { user_id, text: original_text?.substring(0, 50) + '...' });
  
  if (!user_id) {
    return res.status(401).json({
      success: false,
      error: '用户未登录'
    });
  }
  
  const collection = {
    id: collections.length + 1,
    user_id: user_id,
    original_text: original_text,
    url: url,
    title: title || '未命名',
    source: source || 'chrome-extension',
    metadata: metadata || {},
    created_at: new Date().toISOString(),
    ai_summary: `这是AI生成的摘要：${original_text?.substring(0, 100)}...`,
    ai_category: '技术',
    ai_keywords: ['测试', 'Chrome扩展', '本地开发'],
    ai_sentiment: 'neutral'
  };
  
  collections.push(collection);
  
  res.json({
    success: true,
    data: collection,
    message: '收藏成功'
  });
});

// 获取收藏列表
app.get('/api/v1/collections', (req, res) => {
  const { user_id, page = 1, size = 10 } = req.query;
  
  console.log('[LOCAL-TEST] 获取收藏列表:', { user_id, page, size });
  
  if (!user_id) {
    return res.status(401).json({
      success: false,
      error: '用户未登录'
    });
  }
  
  const userCollections = collections.filter(c => c.user_id == user_id);
  const start = (page - 1) * size;
  const end = start + parseInt(size);
  const items = userCollections.slice(start, end);
  
  res.json({
    success: true,
    data: {
      items: items,
      total: userCollections.length,
      page: parseInt(page),
      size: parseInt(size),
      pages: Math.ceil(userCollections.length / size)
    }
  });
});

// 生成周报
app.get('/api/v1/weekly-report/:user_id', (req, res) => {
  const { user_id } = req.params;
  
  console.log('[LOCAL-TEST] 生成周报:', { user_id });
  
  if (!user_id) {
    return res.status(401).json({
      success: false,
      error: '用户未登录'
    });
  }
  
  const userCollections = collections.filter(c => c.user_id == user_id);
  
  const report = {
    report_id: `report-${Date.now()}`,
    user_id: user_id,
    week_start: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
    week_end: new Date().toISOString(),
    total_count: userCollections.length,
    categories: {
      '技术': userCollections.filter(c => c.ai_category === '技术').length,
      '生活': userCollections.filter(c => c.ai_category === '生活').length,
      '工作': userCollections.filter(c => c.ai_category === '工作').length
    },
    summary: `本周共收藏了${userCollections.length}条内容，主要涉及技术领域。AI分析显示您的兴趣集中在技术相关内容上。`,
    top_keywords: ['测试', 'Chrome扩展', '本地开发'],
    sentiment_analysis: {
      positive: Math.floor(userCollections.length * 0.3),
      neutral: Math.floor(userCollections.length * 0.6),
      negative: Math.floor(userCollections.length * 0.1)
    },
    recommendations: [
      '建议多关注技术趋势',
      '可以尝试收藏更多生活类内容',
      '保持当前的学习热情'
    ]
  };
  
  res.json({
    success: true,
    data: report
  });
});

// 搜索收藏
app.get('/api/v1/search', (req, res) => {
  const { user_id, keyword, exactMatch = false, favoritesOnly = false } = req.query;
  
  console.log('[LOCAL-TEST] 搜索收藏:', { user_id, keyword, exactMatch, favoritesOnly });
  
  if (!user_id) {
    return res.status(401).json({
      success: false,
      error: '用户未登录'
    });
  }
  
  let results = collections.filter(c => c.user_id == user_id);
  
  if (keyword) {
    results = results.filter(c => 
      c.original_text.toLowerCase().includes(keyword.toLowerCase()) ||
      c.title.toLowerCase().includes(keyword.toLowerCase()) ||
      c.ai_summary.toLowerCase().includes(keyword.toLowerCase())
    );
  }
  
  res.json({
    success: true,
    data: {
      items: results,
      total: results.length,
      keyword: keyword
    }
  });
});

// 错误处理中间件
app.use((err, req, res, next) => {
  console.error('[LOCAL-TEST] 错误:', err);
  res.status(500).json({
    success: false,
    error: '服务器内部错误',
    message: err.message
  });
});

// 404处理
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: '接口不存在',
    path: req.path
  });
});

// 启动服务器
app.listen(PORT, () => {
  console.log(`\n🚀 本地测试服务器已启动`);
  console.log(`📡 服务器地址: http://localhost:${PORT}`);
  console.log(`🔗 API地址: http://localhost:${PORT}/api/v1`);
  console.log(`🏥 健康检查: http://localhost:${PORT}/health`);
  console.log('');
  console.log('📋 可用接口:');
  console.log('  POST /api/v1/auth/login - 用户登录');
  console.log('  POST /api/v1/collect - 文本收藏');
  console.log('  GET  /api/v1/collections - 收藏列表');
  console.log('  GET  /api/v1/weekly-report/:user_id - 生成周报');
  console.log('  GET  /api/v1/search - 搜索收藏');
  console.log('');
  console.log('👤 测试账号:');
  console.log('  用户名: test');
  console.log('  密码: test123');
  console.log('  Token: test-token-12345');
  console.log('');
  console.log('💡 使用说明:');
  console.log('  1. 启动此服务器');
  console.log('  2. 修改Chrome扩展的config.js');
  console.log('  3. 将CURRENT_ENV改为"development"');
  console.log('  4. 测试扩展功能');
  console.log('');
});

module.exports = app;