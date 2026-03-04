// background.js - Service Worker for Chrome Extension

// 导入API配置
import { API_CONFIG } from './config.js';

// API配置（从config.js获取）
let currentApiUrl = API_CONFIG.apiUrl;

// 离线缓存队列
let offlineQueue = [];

// 初始化
chrome.runtime.onInstalled.addListener(() => {
  console.log('AI书签收藏助手已安装');
  
  // 创建右键菜单
  chrome.contextMenus.create({
    id: 'ai-bookmark-collect',
    title: '收藏选中内容到AI书签',
    contexts: ['selection']
  });
  
  // 加载离线队列
  loadOfflineQueue();
});

// 监听右键菜单点击
chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === 'ai-bookmark-collect') {
    if (info.selectionText) {
      // 收藏选中文本
      collectText(info.selectionText, tab.url, tab);
    } else {
      // 收藏整个网页
      collectWebPage(tab.url, tab);
    }
  }
});

// 监听来自content script的消息
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'collect') {
    collectText(request.text, request.url, sender.tab)
      .then(result => sendResponse({ success: true, data: result }))
      .catch(error => sendResponse({ success: false, error: error.message }));
    return true; // 异步响应
  }
  
  if (request.action === 'login') {
    login(request.username, request.password)
      .then(result => sendResponse(result))
      .catch(error => sendResponse({ success: false, error: error.message }));
    return true;
  }
  
  if (request.action === 'getCollections') {
    getCollections(request.page, request.size)
      .then(result => sendResponse(result))
      .catch(error => sendResponse({ success: false, error: error.message }));
    return true;
  }

  if (request.action === 'syncOfflineQueue') {
    syncOfflineQueue()
      .then(() => sendResponse({ success: true }))
      .catch(error => sendResponse({ success: false, error: error.message }));
    return true;
  }

  // 周报功能相关消息
  if (request.action === 'getWeeklyReports') {
    getWeeklyReports(request.userId, request.page, request.size)
      .then(result => {
        console.log('周报 API 调用成功，返回数据:', result);
        sendResponse(result);
      })
      .catch(error => {
        console.error('周报 API 调用失败:', error);
        sendResponse({ success: false, error: error.message });
      });
    return true; // 保持消息通道开放
  }

  if (request.action === 'generateCurrentWeekReport') {
    generateCurrentWeekReport(request.userId)
      .then(result => {
        console.log('生成周报成功，返回数据:', result);
        sendResponse(result);
      })
      .catch(error => {
        console.error('生成周报失败:', error);
        sendResponse({ success: false, error: error.message });
      });
    return true;
  }

  if (request.action === 'getWeeklyReportDetail') {
    getWeeklyReportDetail(request.reportId)
      .then(result => {
        console.log('获取周报详情成功，返回数据:', result);
        sendResponse(result);
      })
      .catch(error => {
        console.error('获取周报详情失败:', error);
        sendResponse({ success: false, error: error.message });
      });
    return true;
  }

  // 搜索功能
  if (request.action === 'searchCollections') {
    searchCollections(request.keyword, request.exactMatch, request.favoritesOnly, request.page, request.size)
      .then(result => sendResponse(result))
      .catch(error => sendResponse({ success: false, error: error.message }));
    return true;
  }

  // 生成周报
  if (request.action === 'generateWeeklyReport') {
    generateWeeklyReport(request.userId)
      .then(result => sendResponse(result))
      .catch(error => sendResponse({ success: false, error: error.message }));
    return true;
  }
});

// 增强的网络请求函数 - 优化超时和重试逻辑
async function fetchWithRetry(url, options = {}, maxRetries = 3) {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const controller = new AbortController();
      // 动态调整超时时间：第一次15秒，后续尝试增加时间
      const timeoutSeconds = attempt === 1 ? 15000 : attempt * 10000; // 15s, 20s, 30s
      const timeoutId = setTimeout(() => {
        console.log(`请求超时 (${attempt}/${maxRetries}): ${url} (超时: ${timeoutSeconds/1000}s)`);
        controller.abort('Request timeout');
      }, timeoutSeconds);
      
      // 保持 Service Worker 活跃直到请求完成
      const keepAlive = setInterval(() => {
        console.log('Keeping service worker alive...');
      }, 5000);
      
      let response;
      try {
        response = await fetch(url, {
          ...options,
          signal: controller.signal
        });
      } catch (fetchError) {
        // 清理定时器
        clearTimeout(timeoutId);
        clearInterval(keepAlive);
        
        // 处理 abort 错误
        if (fetchError.name === 'AbortError') {
          const abortReason = fetchError.message || 'Request aborted';
          console.error(`请求被中止 (尝试 ${attempt}/${maxRetries}):`, abortReason);
          throw new Error(`网络连接超时，请检查后端服务是否正在运行 (尝试 ${attempt}/${maxRetries})`);
        }
        
        // 处理网络错误
        if (fetchError.name === 'TypeError') {
          throw new Error(`无法连接到服务器，请检查后端服务是否正在运行 (${currentApiUrl})`);
        }
        
        throw fetchError;
      }
      
      clearTimeout(timeoutId);
      clearInterval(keepAlive);
      
      // 如果是 5xx 错误，尝试重试
      if (response.status >= 500) {
        throw new Error(`服务器错误：HTTP ${response.status}`);
      }
      
      return response;
    } catch (error) {
      console.error(`请求失败 (尝试 ${attempt}/${maxRetries}):`, error.message);
      
      if (attempt === maxRetries) {
        // 最后一次尝试失败，提供详细的错误信息
        if (error.message.includes('abort')) {
          throw new Error(`请求超时，后端服务可能未响应。请确保服务正在运行 (${currentApiUrl})`);
        }
        throw error;
      }
      
      // 等待一段时间后重试（指数退避）
      await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
    }
  }
}

// 用户登录
async function login(username, password) {
  try {
    const loginUrl = `${currentApiUrl}/api/v1/auth/login`;
    console.log('=== 登录请求开始 ===');
    console.log('API 地址:', loginUrl);
    console.log('用户名:', username);
    
    const response = await fetchWithRetry(loginUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Cache-Control': 'no-cache'
      },
      body: JSON.stringify({ username, password }),
      mode: 'cors',
      credentials: 'omit',
      cache: 'no-cache',
      redirect: 'follow',
      referrer: 'no-referrer',
    });
    
    console.log('响应状态码:', response.status);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('HTTP 错误:', response.status, errorText);
      throw new Error(`HTTP ${response.status}: ${errorText || '服务器错误'}`);
    }
    
    const data = await response.json();
    console.log('响应数据:', data);
    
    if (data.success) {
      console.log('登录成功，保存用户信息');
      // 保存 token 和用户信息
      await chrome.storage.local.set({
        token: data.token,
        userId: data.user_id,
        isLoggedIn: true
      });
      console.log('用户信息已保存');
      return data;
    } else {
      const errorMsg = data.message || data.error || '登录失败';
      console.error('登录失败:', errorMsg);
      throw new Error(errorMsg);
    }
  } catch (error) {
    console.error('=== 登录错误 ===');
    console.error('错误类型:', error.name);
    console.error('错误消息:', error.message);
    
    // 提供更友好的错误信息
    let userFriendlyError = error.message;
    
    if (error.name === 'AbortError') {
      userFriendlyError = '登录请求超时，请检查后端服务是否正在运行';
    } else if (error.name === 'TypeError' || error.message.includes('Failed to fetch')) {
      userFriendlyError = `无法连接到服务器，请确保后端服务正在运行 (${currentApiUrl})`;
    } else if (error.message.includes('HTTP 5')) {
      userFriendlyError = '服务器错误，请稍后重试';
    }
    
    throw { 
      name: 'LoginError',
      message: userFriendlyError,
      originalError: error.message
    };
  }
}

// 收藏文本
async function collectText(text, url, tab) {
  try {
    console.log('Collecting text:', text.substring(0, 50) + '...'); // 调试日志
    
    // 获取用户信息
    const storage = await chrome.storage.local.get(['userId', 'token', 'isLoggedIn']);
    
    if (!storage.isLoggedIn || !storage.token) {
      console.log('User not logged in'); // 调试日志
      throw new Error('请先登录');
    }
    
    console.log('Sending request to API with token:', storage.token ? 'TOKEN_PRESENT' : 'NO_TOKEN'); // 调试日志
    
    const response = await fetchWithRetry(`${currentApiUrl}/api/v1/collect`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${storage.token}`,
        'Accept': 'application/json',
        'Cache-Control': 'no-cache'
      },
      body: JSON.stringify({
        user_id: storage.userId,
        original_text: text,
        url: url
      }),
      mode: 'cors',
      credentials: 'omit',
      cache: 'no-cache',
      redirect: 'follow',
      referrer: 'no-referrer',
    });
    
    // 检查HTTP响应状态
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`HTTP ${response.status}: ${errorText}`);
    }
    
    const data = await response.json();
    
    console.log('API response:', data); // 调试日志
    
    if (data.success) {
      // 确保API响应中包含collect_id字段，以兼容Chrome扩展期望
      const collectId = data.collect_id || data.collection_id || 'unknown';
      // 如果API返回collection_id但扩展期望collect_id，我们需要适配
      const adaptedData = {
        ...data,
        collect_id: collectId
      };
      
      // 显示成功通知
      showNotification('收藏成功', `已收藏并开始AI分析\nID: ${collectId}`);
      return adaptedData;
    } else {
      throw new Error(data.error || data.message || '收藏失败');
    }
  } catch (error) {
    console.error('Collect error:', error);
    
    // 如果网络错误，添加到离线队列
    if (error.message.includes('Failed to fetch') || 
        error.message.includes('NetworkError') || 
        error.message.includes('TypeError') ||
        error.message.includes('404') ||
        error.message.includes('401') ||
        error.name === 'TypeError' ||
        error.constructor.name === 'TypeError') {
      // 检查是否已登录，如果没登录就不加入离线队列
      const storage = await chrome.storage.local.get(['isLoggedIn']);
      if (storage.isLoggedIn) {
        await addToOfflineQueue({ text, url, timestamp: Date.now() });
        showNotification('已添加到离线队列', '网络恢复后将自动同步');
      }
    }
    
    // 更具体的错误信息
    if (error.name === 'TypeError' && error.message.includes('fetch')) {
      throw new Error(`网络连接失败，请检查后端服务是否正在运行 (${currentApiUrl})`);
    }
    
    throw error;
  }
}

// 收藏整个网页
async function collectWebPage(url, tab) {
  try {
    console.log('Collecting web page:', url);
    
    // 获取用户信息
    const storage = await chrome.storage.local.get(['userId', 'token', 'isLoggedIn']);
    
    if (!storage.isLoggedIn || !storage.token) {
      throw new Error('请先登录');
    }
    
    // 发送收藏请求，只提供URL，让后端自动提取内容
    const response = await fetchWithRetry(`${currentApiUrl}/api/v1/collect`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${storage.token}`,
        'Accept': 'application/json',
        'Cache-Control': 'no-cache'
      },
      body: JSON.stringify({
        user_id: storage.userId,
        original_text: '',  // 空内容，让后端自动提取
        source_url: url,
        title: tab.title || '网页收藏'
      }),
      mode: 'cors',
      credentials: 'omit',
      cache: 'no-cache',
      redirect: 'follow',
      referrer: 'no-referrer',
    });
    
    // 检查HTTP响应状态
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`HTTP ${response.status}: ${errorText}`);
    }
    
    const data = await response.json();
    
    console.log('Web page collection response:', data);
    
    if (data.success) {
      // 确保API响应中包含collect_id字段
      const collectId = data.collect_id || data.collection_id || 'unknown';
      const adaptedData = {
        ...data,
        collect_id: collectId
      };
      
      // 显示成功通知
      showNotification('网页收藏成功', `已收藏网页并开始AI分析\nID: ${collectId}`);
      return adaptedData;
    } else {
      throw new Error(data.error || data.message || '网页收藏失败');
    }
  } catch (error) {
    console.error('Web page collection error:', error);
    
    // 如果网络错误，添加到离线队列
    if (error.message.includes('Failed to fetch') || 
        error.message.includes('NetworkError') || 
        error.message.includes('TypeError') ||
        error.name === 'TypeError') {
      const storage = await chrome.storage.local.get(['isLoggedIn']);
      if (storage.isLoggedIn) {
        await addToOfflineQueue({ 
          text: '', 
          url: url, 
          timestamp: Date.now(),
          type: 'webpage'  // 标记为网页收藏
        });
        showNotification('已添加到离线队列', '网络恢复后将自动同步');
      }
    }
    
    // 更具体的错误信息
    if (error.name === 'TypeError' && error.message.includes('fetch')) {
      throw new Error(`网络连接失败，请检查后端服务是否正在运行 (${currentApiUrl})`);
    }
    
    throw error;
  }
}

// 获取收藏列表
async function getCollections(page = 1, size = 20, userId = null) {
  try {
    console.log(`[getCollections] 开始加载，page=${page}, size=${size}, userId=${userId || '使用存储中的 ID'}`);
    
    const storage = await chrome.storage.local.get(['token', 'isLoggedIn', 'userId']);
    
    if (!storage.isLoggedIn || !storage.token) {
      console.error('[getCollections] 用户未登录');
      throw new Error('请先登录');
    }
    
    // 如果没有传入 userId，使用存储中的 userId
    const finalUserId = userId || storage.userId;
    
    if (!finalUserId) {
      console.error('[getCollections] 缺少用户ID');
      throw new Error('缺少用户ID，请重新登录');
    }
    
    // 构建 URL，添加 user_id 参数
    let url = `${currentApiUrl}/api/v1/collections?page=${page}&size=${size}`;
    if (finalUserId) {
      url += `&user_id=${encodeURIComponent(finalUserId)}`;
    }
    
    console.log(`[getCollections] 请求 URL: ${url}`);
    console.log(`[getCollections] 用户ID: ${finalUserId}`);
    console.log(`[getCollections] Token存在: ${!!storage.token}`);
    
    console.log(`[getCollections] 发送请求到: ${url}`);
    
    const response = await fetchWithRetry(
      url,
      {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${storage.token}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        mode: 'cors',
        credentials: 'omit',
        cache: 'no-cache',
        redirect: 'follow',
        referrer: 'no-referrer',
      }
    );
    
    console.log(`[getCollections] 响应状态: ${response.status}`);
    
    console.log(`[getCollections] 响应状态码：${response.status}`);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[getCollections] HTTP 错误：${response.status}`, errorText);
      throw new Error(`HTTP ${response.status}: ${errorText}`);
    }
    
    const data = await response.json();
    console.log(`[getCollections] 成功获取 ${data.items?.length || 0} 条收藏`);
    return data;
  } catch (error) {
    console.error('[getCollections] 加载失败:', error);
    console.error('[getCollections] 错误详情:', {
      name: error.name,
      message: error.message,
      url: error.config?.url || 'unknown'
    });
    
    // 更具体的错误信息
    if (error.name === 'TypeError' && error.message.includes('fetch')) {
      throw new Error(`网络连接失败，请检查后端服务是否正在运行 (${currentApiUrl})`);
    } else if (error.message.includes('timeout')) {
      throw new Error(`请求超时，请稍后重试 (${currentApiUrl})`);
    } else if (error.message.includes('Failed to fetch')) {
      throw new Error(`无法连接到服务器，请检查网络设置 (${currentApiUrl})`);
    }
    
    throw error;
  }
}

// 离线队列管理
async function loadOfflineQueue() {
  const storage = await chrome.storage.local.get(['offlineQueue']);
  offlineQueue = storage.offlineQueue || [];
}

async function addToOfflineQueue(item) {
  offlineQueue.push(item);
  await chrome.storage.local.set({ offlineQueue });
}

async function syncOfflineQueue() {
  if (offlineQueue.length === 0) return;
  
  const storage = await chrome.storage.local.get(['userId', 'token']);
  const failedItems = [];
  
  for (const item of offlineQueue) {
    try {
      await collectText(item.text, item.url);
    } catch (error) {
      console.error('Sync failed for item:', item, error);
      failedItems.push(item);
    }
  }
  
  offlineQueue = failedItems;
  await chrome.storage.local.set({ offlineQueue });
  
  if (failedItems.length === 0) {
    showNotification('同步完成', '所有离线收藏已同步');
  }
}

// ========== 周报功能API调用 ==========

async function getWeeklyReports(userId, page = 1, size = 10) {
  try {
    console.log('调用周报API，URL:', `${currentApiUrl}/api/v1/weekly-report/list?user_id=${userId}&page=${page}&size=${size}`);
    
    const response = await fetch(`${currentApiUrl}/api/v1/weekly-report/list?user_id=${userId}&page=${page}&size=${size}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    });

    console.log('周报API响应状态:', response.status);

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    console.log('周报API响应数据:', data);
    
    return data;
  } catch (error) {
    console.error('获取周报列表失败:', error);
    throw error;
  }
}

async function generateCurrentWeekReport(userId) {
  try {
    // 获取当前周的日期范围
    const today = new Date();
    const weekStart = new Date(today);
    weekStart.setDate(today.getDate() - today.getDay() + 1); // 本周一
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 6); // 本周日

    const weekStartStr = weekStart.toISOString().split('T')[0];
    const weekEndStr = weekEnd.toISOString().split('T')[0];

    const response = await fetch(`${currentApiUrl}/api/v1/weekly-report/generate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        user_id: userId,
        week_start: weekStartStr,
        week_end: weekEndStr,
        force_regenerate: true
      })
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('生成周报失败:', error);
    throw error;
  }
}

async function getWeeklyReportDetail(reportId) {
  try {
    const response = await fetch(`${currentApiUrl}/api/v1/weekly-report/detail/${reportId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('获取周报详情失败:', error);
    throw error;
  }
}

// 显示通知
function showNotification(title, message) {
  chrome.notifications.create({
    type: 'basic',
    iconUrl: 'icons/icon128.png',
    title: title,
    message: message,
    priority: 2
  });
}

// ========== 搜索功能 ==========

async function searchCollections(keyword, exactMatch = false, favoritesOnly = true, page = 1, size = 20) {
  try {
    const storage = await chrome.storage.local.get(['token', 'isLoggedIn', 'userId']);
    
    if (!storage.isLoggedIn || !storage.token) {
      throw new Error('请先登录');
    }
    
    // 构建搜索 URL - 使用 query 参数而不是 keyword
    let url = `${currentApiUrl}/api/v1/collections/search?query=${encodeURIComponent(keyword)}&page=${page}&size=${size}`;
    
    if (exactMatch) {
      url += '&exact_match=true';
    }
    
    if (favoritesOnly) {
      url += '&favorites_only=true';
    }
    
    console.log('搜索 URL:', url);
    
    const response = await fetchWithRetry(url, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${storage.token}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      mode: 'cors',
      credentials: 'omit',
      cache: 'no-cache',
      redirect: 'follow',
      referrer: 'no-referrer',
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`HTTP ${response.status}: ${errorText}`);
    }
    
    const data = await response.json();
    console.log('搜索结果:', data);
    
    return data;
  } catch (error) {
    console.error('搜索失败:', error);
    
    // 更具体的错误信息
    if (error.name === 'TypeError' && error.message.includes('fetch')) {
      throw new Error(`网络连接失败，请检查后端服务是否正在运行 (${currentApiUrl})`);
    }
    
    throw error;
  }
}

// ========== 周报生成功能 ==========

async function generateWeeklyReport(userId) {
  try {
    console.log('生成周报，用户 ID:', userId);
    
    const response = await fetchWithRetry(`${currentApiUrl}/api/v1/weekly-report/generate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify({
        user_id: userId
      }),
      mode: 'cors',
      credentials: 'omit',
      cache: 'no-cache',
      redirect: 'follow',
      referrer: 'no-referrer',
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`HTTP ${response.status}: ${errorText}`);
    }
    
    const data = await response.json();
    console.log('周报生成响应:', data);
    
    return data;
  } catch (error) {
    console.error('生成周报失败:', error);
    
    // 更具体的错误信息
    if (error.name === 'TypeError' && error.message.includes('fetch')) {
      throw new Error(`网络连接失败，请检查后端服务是否正在运行 (${currentApiUrl})`);
    }
    
    throw error;
  }
}
