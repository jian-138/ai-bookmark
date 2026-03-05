// popup_original.js - 简化版，恢复原始设计

// API配置
const API_CONFIG = {
  baseUrl: 'https://ai-bookmark-production-5ecc.up.railway.app',
  timeout: 30000
};

// 登录管理器
class LoginManager {
  constructor() {
    this.isLoggingIn = false;
  }

  async login(username, password) {
    if (this.isLoggingIn) {
      return { success: false, error: '登录正在进行中' };
    }

    this.isLoggingIn = true;
    
    try {
      console.log(`[登录] 开始登录: ${username}`);
      
      // 发送登录请求到后台脚本
      const response = await this.sendMessageWithTimeout({
        action: 'login',
        username: username.trim(),
        password: password.trim()
      });

      console.log('[登录] 登录响应:', response);

      if (response && response.success) {
        // 保存用户信息
        await this.saveUserInfo({
          token: response.data.token,
          userId: response.data.user_id,
          username: username
        });
        
        console.log('[登录] 登录成功');
        return { success: true, data: response.data };
      } else {
        const errorMsg = response?.error || '登录失败';
        console.error('[登录] 登录失败:', errorMsg);
        return { success: false, error: errorMsg };
      }
    } catch (error) {
      console.error('[登录] 登录异常:', error);
      return { 
        success: false, 
        error: this.getFriendlyErrorMessage(error.message) 
      };
    } finally {
      this.isLoggingIn = false;
    }
  }

  async logout() {
    try {
      await chrome.storage.local.clear();
      console.log('[登录] 登出成功');
      return { success: true };
    } catch (error) {
      console.error('[登录] 登出失败:', error);
      return { success: false, error: error.message };
    }
  }

  async getUserInfo() {
    try {
      const storage = await chrome.storage.local.get(['token', 'userId', 'username']);
      
      if (storage.token && storage.userId) {
        return {
          isLoggedIn: true,
          token: storage.token,
          userId: storage.userId,
          username: storage.username
        };
      }
      
      return { isLoggedIn: false };
    } catch (error) {
      console.error('[登录] 获取用户信息失败:', error);
      return { isLoggedIn: false };
    }
  }

  async saveUserInfo(userInfo) {
    try {
      await chrome.storage.local.set({
        token: userInfo.token,
        userId: userInfo.userId,
        username: userInfo.username,
        isLoggedIn: true,
        loginTime: new Date().toISOString()
      });
      console.log('[登录] 用户信息已保存');
    } catch (error) {
      console.error('[登录] 保存用户信息失败:', error);
      throw error;
    }
  }

  sendMessageWithTimeout(message) {
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error('请求超时，请检查网络连接'));
      }, API_CONFIG.timeout);

      console.log('[登录] 发送消息:', message);
      
      chrome.runtime.sendMessage(message, (response) => {
        clearTimeout(timeout);
        
        if (chrome.runtime.lastError) {
          reject(new Error(`扩展通信错误: ${chrome.runtime.lastError.message}`));
        } else {
          console.log('[登录] 收到响应:', response);
          resolve(response);
        }
      });
    });
  }

  getFriendlyErrorMessage(errorMessage) {
    if (errorMessage.includes('timeout')) {
      return '请求超时，请检查网络连接';
    } else if (errorMessage.includes('Failed to fetch') || errorMessage.includes('网络')) {
      return '网络连接失败，请确保后端服务正常运行';
    } else if (errorMessage.includes('扩展通信')) {
      return '扩展通信错误，请重新加载扩展';
    } else if (errorMessage.includes('用户') || errorMessage.includes('密码')) {
      return errorMessage;
    } else {
      return '登录失败，请稍后重试';
    }
  }
}

// 收藏管理器
class CollectionManager {
  constructor() {
    this.isLoading = false;
  }

  async loadCollections(page = 1, size = 20) {
    if (this.isLoading) {
      return { success: false, error: '正在加载中' };
    }

    this.isLoading = true;
    
    try {
      const userInfo = await loginManager.getUserInfo();
      
      if (!userInfo.isLoggedIn) {
        return { success: false, error: '用户未登录' };
      }

      console.log('[收藏] 加载收藏列表:', { page, size, userId: userInfo.userId });

      const response = await this.sendMessageWithTimeout({
        action: 'getCollections',
        page: page,
        size: size,
        userId: userInfo.userId
      });

      console.log('[收藏] 收藏响应:', response);

      if (response && response.success) {
        const collections = response.items || response.data?.items || [];
        const total = response.total || response.data?.total || 0;
        
        console.log(`[收藏] 获取到 ${collections.length} 条收藏，总计 ${total} 条`);
        
        return { 
          success: true, 
          items: collections,
          total: total
        };
      } else {
        return { 
          success: false, 
          error: response?.error || '加载收藏列表失败' 
        };
      }
    } catch (error) {
      console.error('[收藏] 加载收藏失败:', error);
      return { 
        success: false, 
        error: this.getFriendlyErrorMessage(error.message) 
      };
    } finally {
      this.isLoading = false;
    }
  }

  sendMessageWithTimeout(message) {
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error('请求超时'));
      }, API_CONFIG.timeout);

      console.log('[收藏] 发送消息:', message);
      
      chrome.runtime.sendMessage(message, (response) => {
        clearTimeout(timeout);
        
        if (chrome.runtime.lastError) {
          reject(new Error(`扩展通信错误: ${chrome.runtime.lastError.message}`));
        } else {
          console.log('[收藏] 收到响应:', response);
          resolve(response);
        }
      });
    });
  }

  getFriendlyErrorMessage(errorMessage) {
    if (errorMessage.includes('timeout')) {
      return '请求超时，请检查网络连接';
    } else if (errorMessage.includes('Failed to fetch') || errorMessage.includes('网络')) {
      return '网络连接失败';
    } else if (errorMessage.includes('扩展通信')) {
      return '扩展通信错误';
    } else {
      return '加载失败，请稍后重试';
    }
  }
}

// UI管理器
class UIManager {
  constructor() {
    this.currentPage = 'login';
  }

  showLoginPage() {
    this.hideAllPages();
    document.getElementById('login-page').style.display = 'block';
    this.currentPage = 'login';
    console.log('[UI] 显示登录页面');
  }

  showMainPage() {
    this.hideAllPages();
    document.getElementById('main-page').style.display = 'block';
    this.currentPage = 'main';
    console.log('[UI] 显示主页面');
  }

  hideAllPages() {
    const pages = ['login-page', 'main-page'];
    pages.forEach(pageId => {
      const element = document.getElementById(pageId);
      if (element) {
        element.style.display = 'none';
      }
    });
  }

  showLoading(button, text = '处理中...') {
    if (button) {
      button.originalText = button.textContent;
      button.textContent = text;
      button.disabled = true;
    }
  }

  hideLoading(button) {
    if (button && button.originalText) {
      button.textContent = button.originalText;
      button.disabled = false;
    }
  }

  showError(elementId, message) {
    const errorEl = document.getElementById(elementId);
    if (errorEl) {
      errorEl.textContent = message;
      errorEl.style.display = 'block';
      
      // 3秒后自动隐藏错误信息
      setTimeout(() => {
        errorEl.style.display = 'none';
      }, 5000);
    }
  }

  hideError(elementId) {
    const errorEl = document.getElementById(elementId);
    if (errorEl) {
      errorEl.style.display = 'none';
      errorEl.textContent = '';
    }
  }
}

// 创建全局实例
const loginManager = new LoginManager();
const collectionManager = new CollectionManager();
const uiManager = new UIManager();

// 页面初始化
document.addEventListener('DOMContentLoaded', async function() {
  console.log('=== Chrome扩展弹出页面初始化 ===');
  
  try {
    // 检查登录状态
    const userInfo = await loginManager.getUserInfo();
    console.log('[初始化] 用户状态:', userInfo);
    
    if (userInfo.isLoggedIn) {
      uiManager.showMainPage();
      await loadCollections();
    } else {
      uiManager.showLoginPage();
    }
    
    // 绑定事件监听器
    bindEventListeners();
    
    console.log('=== 初始化完成 ===');
  } catch (error) {
    console.error('[初始化] 失败:', error);
    uiManager.showLoginPage();
    uiManager.showError('login-error', '初始化失败，请刷新页面重试');
  }
});

// 绑定事件监听器
function bindEventListeners() {
  console.log('[事件绑定] 开始绑定事件监听器');
  
  // 登录按钮
  const loginBtn = document.getElementById('login-btn');
  if (loginBtn) {
    loginBtn.addEventListener('click', handleLoginClick);
    console.log('[事件绑定] 登录按钮事件已绑定');
  }
  
  // 登出按钮
  const logoutBtn = document.getElementById('logout-btn');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', handleLogoutClick);
    console.log('[事件绑定] 登出按钮事件已绑定');
  }
  
  // 同步按钮
  const syncBtn = document.getElementById('sync-btn');
  if (syncBtn) {
    syncBtn.addEventListener('click', handleSyncClick);
    console.log('[事件绑定] 同步按钮事件已绑定');
  }
  
  // 周报按钮
  const weeklyReportBtn = document.getElementById('weekly-report-btn');
  if (weeklyReportBtn) {
    weeklyReportBtn.addEventListener('click', handleWeeklyReportClick);
    console.log('[事件绑定] 周报按钮事件已绑定');
  }
  
  console.log('[事件绑定] 事件监听器绑定完成');
}

// 事件处理函数
async function handleLoginClick() {
  console.log('=== 登录按钮点击 ===');
  
  const username = document.getElementById('username').value.trim();
  const password = document.getElementById('password').value.trim();
  const loginBtn = document.getElementById('login-btn');
  
  console.log('[登录] 用户名:', username);
  
  if (!username || !password) {
    uiManager.showError('login-error', '请输入用户名和密码');
    return;
  }
  
  // 隐藏错误信息
  uiManager.hideError('login-error');
  uiManager.showLoading(loginBtn, '登录中...');
  
  try {
    const result = await loginManager.login(username, password);
    
    if (result.success) {
      console.log('[登录] 登录成功，切换到主页面');
      uiManager.showMainPage();
      await loadCollections();
    } else {
      console.error('[登录] 登录失败:', result.error);
      uiManager.showError('login-error', result.error);
    }
  } catch (error) {
    console.error('[登录] 登录异常:', error);
    uiManager.showError('login-error', '登录失败，请稍后重试');
  } finally {
    uiManager.hideLoading(loginBtn);
  }
}

async function handleLogoutClick() {
  console.log('=== 登出按钮点击 ===');
  
  try {
    const result = await loginManager.logout();
    
    if (result.success) {
      uiManager.showLoginPage();
      console.log('[登出] 登出成功');
    } else {
      console.error('[登出] 登出失败:', result.error);
      alert('登出失败: ' + result.error);
    }
  } catch (error) {
    console.error('[登出] 登出异常:', error);
    alert('登出失败，请稍后重试');
  }
}

async function handleSyncClick() {
  console.log('=== 同步按钮点击 ===');
  
  const queue = await chrome.storage.local.get(['offlineQueue']);
  
  if (!queue.offlineQueue || queue.offlineQueue.length === 0) {
    alert('没有待同步的离线收藏');
    return;
  }
  
  const syncBtn = document.getElementById('sync-btn');
  if (syncBtn) {
    syncBtn.disabled = true;
    syncBtn.textContent = '同步中...';
  }
  
  try {
    let successCount = 0;
    let failCount = 0;
    
    for (const item of queue.offlineQueue) {
      try {
        await chrome.runtime.sendMessage({
          action: 'collect',
          text: item.text,
          url: item.url,
          title: item.title
        });
        successCount++;
      } catch (error) {
        console.error('同步失败:', error);
        failCount++;
      }
    }
    
    // 清空离线队列
    await chrome.storage.local.remove(['offlineQueue']);
    
    alert(`同步完成！成功：${successCount}, 失败：${failCount}`);
    
    // 刷新收藏列表
    await loadCollections();
    
  } catch (error) {
    console.error('同步错误:', error);
    alert('同步失败: ' + error.message);
  } finally {
    if (syncBtn) {
      syncBtn.disabled = false;
      syncBtn.textContent = '🔄';
    }
  }
}

async function handleWeeklyReportClick() {
  console.log('=== 周报按钮点击 ===');
  alert('周报功能开发中，敬请期待！');
}

// 加载收藏列表
async function loadCollections() {
  console.log('=== 加载收藏列表 ===');
  
  const listEl = document.getElementById('collections-list');
  if (!listEl) {
    console.error('[加载收藏] 找不到列表元素');
    return;
  }
  
  listEl.innerHTML = '<div class="loading">加载中...</div>';
  
  try {
    const result = await collectionManager.loadCollections(1, 20);
    
    if (result.success) {
      const collections = result.items;
      const total = result.total;
      
      console.log(`[加载收藏] 获取到 ${collections.length} 条收藏，总计 ${total} 条`);
      
      if (collections.length > 0) {
        renderCollections(collections);
        
        // 更新统计信息
        const totalCountEl = document.getElementById('total-count');
        if (totalCountEl) {
          totalCountEl.textContent = total;
        }
      } else {
        listEl.innerHTML = '<div class="empty">暂无收藏</div>';
      }
    } else {
      console.error('[加载收藏] 加载失败:', result.error);
      listEl.innerHTML = `<div class="error">加载失败: ${result.error}</div>`;
    }
  } catch (error) {
    console.error('[加载收藏] 加载异常:', error);
    listEl.innerHTML = '<div class="error">加载失败，请稍后重试</div>';
  }
}

// 渲染收藏列表
function renderCollections(collections) {
  const listEl = document.getElementById('collections-list');
  if (!listEl) return;
  
  if (!collections || collections.length === 0) {
    listEl.innerHTML = '<div class="empty">暂无收藏</div>';
    return;
  }
  
  let html = '';
  
  collections.forEach(item => {
    const collectId = item.collect_id || item.id || 'unknown';
    const text = item.original_text || '无内容';
    const url = item.url || '';
    const keywords = item.ai_keywords || item.keywords || [];
    const category = item.ai_category || item.category || '未分类';
    const createdAt = item.created_at ? 
      new Date(item.created_at).toLocaleString('zh-CN') : '未知时间';
    
    // 截断文本
    const truncatedText = text.length > 80 ? text.substring(0, 80) + '...' : text;
    
    html += `
      <div class="collection-item" data-id="${collectId}">
        <div class="collection-header">
          <span class="collection-category">${category}</span>
          <span class="collection-time">${createdAt}</span>
        </div>
        <div class="collection-content">${truncatedText}</div>
        ${url ? `<div class="collection-url"><a href="${url}" target="_blank">🔗 查看原文</a></div>` : ''}
        ${keywords.length > 0 ? `
          <div class="collection-keywords">
            ${keywords.map(kw => `<span class="keyword-tag">${kw}</span>`).join('')}
          </div>
        ` : ''}
      </div>
    `;
  });
  
  listEl.innerHTML = html;
}