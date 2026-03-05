// background.js - 修复版后台脚本
// 解决登录和API通信问题

// 全局配置
const API_CONFIG = {
  baseUrl: 'https://ai-bookmark-production-5ecc.up.railway.app',
  timeout: 30000,
  maxRetries: 3
};

// 扩展安装时的初始化
chrome.runtime.onInstalled.addListener(() => {
  console.log('AI书签收藏助手已安装');
  
  // 创建右键菜单
  chrome.contextMenus.create({
    id: 'collect-text',
    title: '收藏到AI书签',
    contexts: ['selection']
  });
  
  // 创建工具栏按钮菜单
  chrome.contextMenus.create({
    id: 'quick-collect',
    title: '快速收藏当前页面',
    contexts: ['action']
  });
});

// 右键菜单点击事件
chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === 'collect-text' && info.selectionText) {
    handleTextCollection(info.selectionText, tab);
  } else if (info.menuItemId === 'quick-collect') {
    handleQuickCollect(tab);
  }
});

// 工具栏按钮点击事件
chrome.action.onClicked.addListener((tab) => {
  chrome.action.openPopup();
});

// 消息监听器
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log('[Background] 收到消息:', request);
  
  if (request.action === 'collect') {
    handleTextCollection(request.text, sender.tab)
      .then(result => sendResponse(result))
      .catch(error => sendResponse({ 
        success: false, 
        error: error.message || '收藏失败' 
      }));
    return true; // 保持消息通道开放
  }
  
  if (request.action === 'get-user-info') {
    getUserInfo()
      .then(userInfo => sendResponse({ success: true, data: userInfo }))
      .catch(error => sendResponse({ 
        success: false, 
        error: error.message || '获取用户信息失败' 
      }));
    return true;
  }
  
  if (request.action === 'login') {
    handleLogin(request.username, request.password)
      .then(result => sendResponse(result))
      .catch(error => sendResponse({ 
        success: false, 
        error: error.message || '登录失败' 
      }));
    return true;
  }
  
  if (request.action === 'logout') {
    handleLogout()
      .then(() => sendResponse({ success: true }))
      .catch(error => sendResponse({ 
        success: false, 
        error: error.message || '登出失败' 
      }));
    return true;
  }
  
  if (request.action === 'getCollections') {
    handleGetCollections(request)
      .then(result => sendResponse(result))
      .catch(error => sendResponse({ 
        success: false, 
        error: error.message || '获取收藏列表失败' 
      }));
    return true;
  }
  
  if (request.action === 'generateWeeklyReport') {
    handleGenerateWeeklyReport(request)
      .then(result => sendResponse(result))
      .catch(error => sendResponse({ 
        success: false, 
        error: error.message || '生成周报失败' 
      }));
    return true;
  }
  
  if (request.action === 'searchWeeklyCollections') {
    handleSearchWeeklyCollections(request)
      .then(result => sendResponse(result))
      .catch(error => sendResponse({ 
        success: false, 
        error: error.message || '搜索失败' 
      }));
    return true;
  }
  
  // 如果都不是已知的action，返回错误
  console.warn('[Background] 未知的action:', request.action);
  sendResponse({ 
    success: false, 
    error: `未知的action: ${request.action}` 
  });
  return false;
});

// 处理文本收藏
async function handleTextCollection(text, tab) {
  try {
    console.log('[Background] 处理文本收藏:', text);
    
    const userInfo = await getUserInfo();
    if (!userInfo.isLoggedIn) {
      return { success: false, error: '请先登录' };
    }
    
    const payload = {
      user_id: userInfo.userId,
      original_text: text,
      url: tab.url,
      title: tab.title,
      source: 'context-menu',
      metadata: {
        timestamp: new Date().toISOString(),
        user_agent: navigator.userAgent,
        source_type: 'context-menu'
      }
    };
    
    console.log('[Background] 发送收藏请求:', payload);
    
    const response = await fetchWithTimeout(`${API_CONFIG.baseUrl}/api/v1/collect`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${userInfo.token}`
      },
      body: JSON.stringify(payload)
    });
    
    if (response.success) {
      console.log('[Background] 收藏成功');
      showNotification('收藏成功', '文本已添加到AI书签');
      return { success: true, data: response.data };
    } else {
      console.error('[Background] 收藏失败:', response.error);
      showNotification('收藏失败', response.error);
      return { success: false, error: response.error };
    }
  } catch (error) {
    console.error('[Background] 收藏异常:', error);
    showNotification('收藏失败', error.message);
    return { success: false, error: error.message };
  }
}

// 处理快速收藏
async function handleQuickCollect(tab) {
  try {
    console.log('[Background] 处理快速收藏:', tab.url);
    
    const results = await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: () => {
        return {
          title: document.title,
          url: window.location.href,
          content: document.body.innerText.substring(0, 1000)
        };
      }
    });
    
    if (results && results[0]) {
      const pageData = results[0].result;
      
      const result = await handleTextCollection(pageData.content, {
        url: pageData.url,
        title: pageData.title
      });
      
      if (result.success) {
        showNotification('收藏成功', '页面已添加到AI书签');
      } else {
        showNotification('收藏失败', result.error);
      }
      
      return result;
    } else {
      return { success: false, error: '无法获取页面内容' };
    }
  } catch (error) {
    console.error('[Background] 快速收藏异常:', error);
    showNotification('收藏失败', error.message);
    return { success: false, error: error.message };
  }
}

// 用户登录
async function handleLogin(username, password) {
  try {
    console.log('[Background] 用户登录:', username);
    
    if (!username || !password) {
      return { success: false, error: '用户名和密码不能为空' };
    }
    
    const response = await fetchWithTimeout(`${API_CONFIG.baseUrl}/api/v1/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ 
        username: username.trim(), 
        password: password.trim() 
      })
    });
    
    if (response.success && response.data) {
      const data = response.data;
      
      // 保存用户信息到存储
      await chrome.storage.local.set({
        token: data.token,
        user_id: data.user_id,
        username: username,
        isLoggedIn: true,
        login_time: new Date().toISOString()
      });
      
      console.log('[Background] 登录成功:', data.user_id);
      return { 
        success: true, 
        data: data,
        token: data.token,
        user_id: data.user_id
      };
    } else {
      console.error('[Background] 登录失败:', response.error);
      return { success: false, error: response.error || '登录失败' };
    }
  } catch (error) {
    console.error('[Background] 登录异常:', error);
    return { success: false, error: error.message || '登录失败' };
  }
}

// 用户登出
async function handleLogout() {
  try {
    console.log('[Background] 用户登出');
    
    await chrome.storage.local.remove(['token', 'user_id', 'username', 'isLoggedIn', 'login_time']);
    
    console.log('[Background] 登出成功');
    return { success: true };
  } catch (error) {
    console.error('[Background] 登出异常:', error);
    return { success: false, error: error.message };
  }
}

// 获取用户信息
async function getUserInfo() {
  try {
    const result = await chrome.storage.local.get(['token', 'user_id', 'username', 'isLoggedIn']);
    
    if (result.token && result.user_id) {
      return {
        isLoggedIn: true,
        token: result.token,
        userId: result.user_id,
        username: result.username || '未知用户'
      };
    } else {
      return { isLoggedIn: false };
    }
  } catch (error) {
    console.error('[Background] 获取用户信息异常:', error);
    return { isLoggedIn: false };
  }
}

// 获取收藏列表
async function handleGetCollections(request) {
  try {
    console.log('[Background] 获取收藏列表:', request);
    
    const userInfo = await getUserInfo();
    if (!userInfo.isLoggedIn) {
      return { success: false, error: '用户未登录' };
    }
    
    const page = request.page || 1;
    const size = request.size || 20;
    
    const response = await fetchWithTimeout(`${API_CONFIG.baseUrl}/api/v1/collections?page=${page}&size=${size}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${userInfo.token}`
      }
    });
    
    if (response.success) {
      console.log('[Background] 获取收藏列表成功');
      return { success: true, data: response.data };
    } else {
      console.error('[Background] 获取收藏列表失败:', response.error);
      return { success: false, error: response.error || '获取收藏列表失败' };
    }
  } catch (error) {
    console.error('[Background] 获取收藏列表异常:', error);
    return { success: false, error: error.message || '获取收藏列表失败' };
  }
}

// 生成周报
async function handleGenerateWeeklyReport(request) {
  try {
    console.log('[Background] 生成周报:', request);
    
    const userInfo = await getUserInfo();
    if (!userInfo.isLoggedIn) {
      return { success: false, error: '用户未登录' };
    }
    
    const response = await fetchWithTimeout(`${API_CONFIG.baseUrl}/api/v1/weekly-report`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${userInfo.token}`
      },
      body: JSON.stringify({ 
        user_id: userInfo.userId 
      })
    });
    
    if (response.success) {
      console.log('[Background] 生成周报成功');
      return { success: true, data: response.data };
    } else {
      console.error('[Background] 生成周报失败:', response.error);
      return { success: false, error: response.error || '生成周报失败' };
    }
  } catch (error) {
    console.error('[Background] 生成周报异常:', error);
    return { success: false, error: error.message || '生成周报失败' };
  }
}

// 搜索周报收藏
async function handleSearchWeeklyCollections(request) {
  try {
    console.log('[Background] 搜索周报收藏:', request);
    
    const userInfo = await getUserInfo();
    if (!userInfo.isLoggedIn) {
      return { success: false, error: '用户未登录' };
    }
    
    const params = new URLSearchParams({
      keyword: request.keyword,
      exact_match: request.exactMatch || false,
      favorites_only: request.favoritesOnly || false,
      user_id: userInfo.userId
    });
    
    const response = await fetchWithTimeout(`${API_CONFIG.baseUrl}/api/v1/search?${params}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${userInfo.token}`
      }
    });
    
    if (response.success) {
      console.log('[Background] 搜索成功');
      return { success: true, data: response.data };
    } else {
      console.error('[Background] 搜索失败:', response.error);
      return { success: false, error: response.error || '搜索失败' };
    }
  } catch (error) {
    console.error('[Background] 搜索异常:', error);
    return { success: false, error: error.message || '搜索失败' };
  }
}

// 带超时的fetch函数
async function fetchWithTimeout(url, options = {}) {
  try {
    console.log('[Background] Fetch请求:', url);
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), API_CONFIG.timeout);
    
    const response = await fetch(url, {
      ...options,
      signal: controller.signal
    });
    
    clearTimeout(timeoutId);
    
    console.log('[Background] Fetch响应状态:', response.status);
    
    if (!response.ok) {
      let errorData;
      try {
        errorData = await response.json();
      } catch (e) {
        errorData = { error: `HTTP ${response.status}: ${response.statusText}` };
      }
      
      return { 
        success: false, 
        error: errorData.error || `HTTP ${response.status}: ${response.statusText}` 
      };
    }
    
    const data = await response.json();
    console.log('[Background] Fetch响应数据:', data);
    
    return { 
      success: true, 
      data: data 
    };
    
  } catch (error) {
    clearTimeout(timeoutId);
    
    if (error.name === 'AbortError') {
      console.error('[Background] Fetch超时:', error);
      return { success: false, error: '请求超时，请检查网络连接' };
    } else if (error.name === 'TypeError' && error.message.includes('fetch')) {
      console.error('[Background] Fetch网络错误:', error);
      return { success: false, error: '网络连接失败，请确保后端服务正常运行' };
    } else {
      console.error('[Background] Fetch其他错误:', error);
      return { success: false, error: error.message || '请求失败' };
    }
  }
}

// 显示通知
function showNotification(title, message) {
  try {
    chrome.notifications.create({
      type: 'basic',
      iconUrl: 'icons/icon48.png',
      title: title,
      message: message
    });
  } catch (error) {
    console.error('[Background] 显示通知失败:', error);
  }
}

// 定期检查登录状态
setInterval(async () => {
  try {
    const userInfo = await getUserInfo();
    console.log('[Background] 当前登录状态:', userInfo.isLoggedIn ? '已登录' : '未登录');
  } catch (error) {
    console.error('[Background] 检查登录状态失败:', error);
  }
}, 300000); // 每5分钟检查一次

console.log('[Background] AI书签收藏助手后台脚本已加载');
console.log('[Background] Railway API地址:', API_CONFIG.baseUrl);