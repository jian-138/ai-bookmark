// background.js - Service Worker for Chrome Extension
// API配置
const API_BASE_URL = 'http://10.81.5.132:8000';
const API_BASE_URL_PRODUCTION = 'https://ai-bookmark-production.up.railway.app';

// 使用本地API（可在设置中切换）
let currentApiUrl = API_BASE_URL;

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
  if (info.menuItemId === 'ai-bookmark-collect' && info.selectionText) {
    collectText(info.selectionText, tab.url, tab);
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
      .then(result => sendResponse({ success: true, data: result }))
      .catch(error => sendResponse({ success: false, error: error.message }));
    return true;
  }
  
  if (request.action === 'getCollections') {
    getCollections(request.page, request.size)
      .then(result => sendResponse({ success: true, data: result }))
      .catch(error => sendResponse({ success: false, error: error.message }));
    return true;
  }

  if (request.action === 'syncOfflineQueue') {
    syncOfflineQueue()
      .then(() => sendResponse({ success: true }))
      .catch(error => sendResponse({ success: false, error: error.message }));
    return true;
  }
});

// 用户登录
async function login(username, password) {
  try {
    const response = await fetch(`${currentApiUrl}/api/v1/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ username, password })
    });
    
    const data = await response.json();
    
    if (data.success) {
      // 保存token和用户信息
      await chrome.storage.local.set({
        token: data.token,
        userId: data.user_id,
        isLoggedIn: true
      });
      return data;
    } else {
      throw new Error(data.message || '登录失败');
    }
  } catch (error) {
    console.error('Login error:', error);
    throw error;
  }
}

// 收藏文本
async function collectText(text, url, tab) {
  try {
    // 获取用户信息
    const storage = await chrome.storage.local.get(['userId', 'token', 'isLoggedIn']);
    
    if (!storage.isLoggedIn) {
      throw new Error('请先登录');
    }
    
    const response = await fetch(`${currentApiUrl}/api/v1/collect`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${storage.token}`
      },
      body: JSON.stringify({
        user_id: storage.userId,
        original_text: text,
        url: url
      })
    });
    
    const data = await response.json();
    
    if (data.success) {
      // 显示成功通知
      showNotification('收藏成功', `已收藏并开始AI分析\nID: ${data.collect_id}`);
      return data;
    } else {
      throw new Error(data.error || '收藏失败');
    }
  } catch (error) {
    console.error('Collect error:', error);
    
    // 如果网络错误，添加到离线队列
    if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError')) {
      await addToOfflineQueue({ text, url, timestamp: Date.now() });
      showNotification('已添加到离线队列', '网络恢复后将自动同步');
    } else {
      throw error;
    }
  }
}

// 获取收藏列表
async function getCollections(page = 1, size = 20) {
  try {
    const storage = await chrome.storage.local.get(['token']);
    
    const response = await fetch(
      `${currentApiUrl}/api/v1/collections?page=${page}&size=${size}`,
      {
        headers: {
          'Authorization': `Bearer ${storage.token}`
        }
      }
    );
    
    return await response.json();
  } catch (error) {
    console.error('Get collections error:', error);
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
