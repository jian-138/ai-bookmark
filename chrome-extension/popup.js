// popup.js - Popup界面逻辑
document.addEventListener('DOMContentLoaded', init);

async function init() {
  // 检查登录状态
  const storage = await chrome.storage.local.get(['isLoggedIn']);
  
  if (storage.isLoggedIn) {
    showMainPage();
    loadCollections();
    checkOfflineQueue();
  } else {
    showLoginPage();
  }
  
  // 绑定事件
  document.getElementById('login-btn').addEventListener('click', handleLogin);
  document.getElementById('logout-btn').addEventListener('click', handleLogout);
  document.getElementById('sync-btn').addEventListener('click', syncOfflineQueue);
}

// 显示登录页面
function showLoginPage() {
  document.getElementById('login-page').style.display = 'block';
  document.getElementById('main-page').style.display = 'none';
}

// 显示主页面
function showMainPage() {
  document.getElementById('login-page').style.display = 'none';
  document.getElementById('main-page').style.display = 'block';
}

// 处理登录
async function handleLogin() {
  const username = document.getElementById('username').value.trim();
  const password = document.getElementById('password').value.trim();
  const errorEl = document.getElementById('login-error');
  const loginBtn = document.getElementById('login-btn');
  
  if (!username || !password) {
    errorEl.textContent = '请输入用户名和密码';
    errorEl.style.display = 'block';
    return;
  }
  
  loginBtn.textContent = '登录中...';
  loginBtn.disabled = true;
  errorEl.style.display = 'none';
  
  try {
    const response = await chrome.runtime.sendMessage({
      action: 'login',
      username,
      password
    });
    
    if (response.success) {
      showMainPage();
      loadCollections();
      checkOfflineQueue();
    } else {
      errorEl.textContent = response.error || '登录失败';
      errorEl.style.display = 'block';
    }
  } catch (error) {
    errorEl.textContent = '登录失败: ' + error.message;
    errorEl.style.display = 'block';
  } finally {
    loginBtn.textContent = '登录';
    loginBtn.disabled = false;
  }
}

// 处理退出
async function handleLogout() {
  await chrome.storage.local.clear();
  showLoginPage();
}

// 加载收藏列表
async function loadCollections() {
  const listEl = document.getElementById('collections-list');
  listEl.innerHTML = '<div class="loading">加载中...</div>';
  
  try {
    const response = await chrome.runtime.sendMessage({
      action: 'getCollections',
      page: 1,
      size: 20
    });
    
    if (response.success && response.data.data) {
      renderCollections(response.data.data);
      document.getElementById('total-count').textContent = response.data.total || 0;
    } else {
      listEl.innerHTML = '<div class="empty">暂无收藏</div>';
    }
  } catch (error) {
    listEl.innerHTML = '<div class="error">加载失败: ' + error.message + '</div>';
  }
}

// 渲染收藏列表
function renderCollections(collections) {
  const listEl = document.getElementById('collections-list');
  
  if (!collections || collections.length === 0) {
    listEl.innerHTML = '<div class="empty">暂无收藏</div>';
    return;
  }
  
  listEl.innerHTML = collections.map(item => `
    <div class="collection-item">
      <div class="collection-header">
        <span class="collection-id">${item.collect_id}</span>
        <span class="collection-status status-${item.status.toLowerCase()}">${getStatusText(item.status)}</span>
      </div>
      <div class="collection-text">${truncate(item.original_text, 100)}</div>
      ${item.url ? `<div class="collection-url"><a href="${item.url}" target="_blank">${item.url}</a></div>` : ''}
      ${item.ai_keywords && item.ai_keywords.length > 0 ? `
        <div class="collection-tags">
          ${item.ai_keywords.map(kw => `<span class="tag">${kw}</span>`).join('')}
        </div>
      ` : ''}
      ${item.summary ? `<div class="collection-summary">${item.summary}</div>` : ''}
      <div class="collection-footer">
        <span class="collection-time">${formatTime(item.created_at)}</span>
      </div>
    </div>
  `).join('');
}

// 检查离线队列
async function checkOfflineQueue() {
  const storage = await chrome.storage.local.get(['offlineQueue']);
  const queue = storage.offlineQueue || [];
  
  if (queue.length > 0) {
    document.getElementById('offline-count').style.display = 'inline';
    document.getElementById('offline-num').textContent = queue.length;
  } else {
    document.getElementById('offline-count').style.display = 'none';
  }
}

// 同步离线队列
async function syncOfflineQueue() {
  const syncBtn = document.getElementById('sync-btn');
  syncBtn.disabled = true;
  
  try {
    await chrome.runtime.sendMessage({ action: 'syncOfflineQueue' });
    await checkOfflineQueue();
    await loadCollections();
  } catch (error) {
    console.error('Sync failed:', error);
  } finally {
    syncBtn.disabled = false;
  }
}

// 工具函数
function getStatusText(status) {
  const statusMap = {
    'PENDING': '待分析',
    'ANALYZED': '已分析',
    'AI_FAILED': '分析失败'
  };
  return statusMap[status] || status;
}

function truncate(text, length) {
  return text.length > length ? text.substring(0, length) + '...' : text;
}

function formatTime(timeStr) {
  const date = new Date(timeStr);
  const now = new Date();
  const diff = now - date;
  
  if (diff < 60000) return '刚刚';
  if (diff < 3600000) return Math.floor(diff / 60000) + '分钟前';
  if (diff < 86400000) return Math.floor(diff / 3600000) + '小时前';
  return date.toLocaleDateString('zh-CN');
}
