// popup.js - 修复版登录功能
// 解决登录失败问题，统一API配置和错误处理

// 全局配置
const API_CONFIG = {
  baseUrl: 'https://ai-bookmark-production-5ecc.up.railway.app',
  timeout: 30000,
  maxRetries: 3
};

// 登录状态管理
class LoginManager {
  constructor() {
    this.isLoggingIn = false;
    this.currentUser = null;
  }

  async login(username, password) {
    if (this.isLoggingIn) {
      return { success: false, error: '登录正在进行中' };
    }

    this.isLoggingIn = true;
    
    try {
      console.log(`[LoginManager] 开始登录: ${username}`);
      
      // 构建登录请求
      const loginData = {
        username: username.trim(),
        password: password.trim()
      };

      // 发送登录请求到后台脚本
      const response = await this.sendMessageWithTimeout({
        action: 'login',
        username: loginData.username,
        password: loginData.password
      });

      console.log('[LoginManager] 登录响应:', response);

      if (response && response.success) {
        // 保存用户信息
        await this.saveUserInfo({
          token: response.data.token,
          userId: response.data.user_id,
          username: username
        });
        
        this.currentUser = {
          username: username,
          userId: response.data.user_id
        };
        
        console.log('[LoginManager] 登录成功');
        return { success: true, data: response.data };
      } else {
        const errorMsg = response?.error || '登录失败';
        console.error('[LoginManager] 登录失败:', errorMsg);
        return { success: false, error: errorMsg };
      }
    } catch (error) {
      console.error('[LoginManager] 登录异常:', error);
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
      this.currentUser = null;
      console.log('[LoginManager] 登出成功');
      return { success: true };
    } catch (error) {
      console.error('[LoginManager] 登出失败:', error);
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
      console.error('[LoginManager] 获取用户信息失败:', error);
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
      console.log('[LoginManager] 用户信息已保存');
    } catch (error) {
      console.error('[LoginManager] 保存用户信息失败:', error);
      throw error;
    }
  }

  sendMessageWithTimeout(message) {
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error('请求超时，请检查网络连接'));
      }, API_CONFIG.timeout);

      console.log('[LoginManager] 发送消息:', message);
      
      chrome.runtime.sendMessage(message, (response) => {
        clearTimeout(timeout);
        
        if (chrome.runtime.lastError) {
          reject(new Error(`扩展通信错误: ${chrome.runtime.lastError.message}`));
        } else {
          console.log('[LoginManager] 收到响应:', response);
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
      return errorMessage; // 保持认证错误信息
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

      console.log('[CollectionManager] 加载收藏列表:', { page, size, userId: userInfo.userId });

      const response = await this.sendMessageWithTimeout({
        action: 'getCollections',
        page: page,
        size: size,
        userId: userInfo.userId
      });

      console.log('[CollectionManager] 收藏响应:', response);

      if (response && response.success) {
        return { 
          success: true, 
          data: response.data || response,
          items: response.data?.items || response.items || [],
          total: response.data?.total || response.total || 0
        };
      } else {
        return { 
          success: false, 
          error: response?.error || '加载收藏列表失败' 
        };
      }
    } catch (error) {
      console.error('[CollectionManager] 加载收藏失败:', error);
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

      console.log('[CollectionManager] 发送消息:', message);
      
      chrome.runtime.sendMessage(message, (response) => {
        clearTimeout(timeout);
        
        if (chrome.runtime.lastError) {
          reject(new Error(`扩展通信错误: ${chrome.runtime.lastError.message}`));
        } else {
          console.log('[CollectionManager] 收到响应:', response);
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

// 创建全局实例
const loginManager = new LoginManager();
const collectionManager = new CollectionManager();

// UI管理器
class UIManager {
  constructor() {
    this.currentPage = 'login';
  }

  showLoginPage() {
    this.hideAllPages();
    document.getElementById('login-page').style.display = 'block';
    this.currentPage = 'login';
    console.log('[UIManager] 显示登录页面');
  }

  showMainPage() {
    this.hideAllPages();
    document.getElementById('main-page').style.display = 'block';
    this.currentPage = 'main';
    console.log('[UIManager] 显示主页面');
  }

  showWeeklyReportPage() {
    this.hideAllPages();
    document.getElementById('weekly-report-page').style.display = 'block';
    this.currentPage = 'weekly';
    console.log('[UIManager] 显示周报页面');
  }

  hideAllPages() {
    const pages = ['login-page', 'main-page', 'weekly-report-page'];
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

// 创建UI管理器实例
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
  
  // 周报相关按钮
  const weeklyReportBtn = document.getElementById('weekly-report-btn');
  if (weeklyReportBtn) {
    weeklyReportBtn.addEventListener('click', handleWeeklyReportClick);
    console.log('[事件绑定] 周报按钮事件已绑定');
  }
  
  const weeklyFavoriteBtn = document.getElementById('weekly-favorite-btn');
  if (weeklyFavoriteBtn) {
    weeklyFavoriteBtn.addEventListener('click', handleWeeklyFavoriteClick);
    console.log('[事件绑定] 周报收藏按钮事件已绑定');
  }
  
  const backToMainBtn = document.getElementById('back-to-main');
  if (backToMainBtn) {
    backToMainBtn.addEventListener('click', handleBackToMainClick);
    console.log('[事件绑定] 返回主页面按钮事件已绑定');
  }
  
  const generateReportBtn = document.getElementById('generate-report-btn');
  if (generateReportBtn) {
    generateReportBtn.addEventListener('click', handleGenerateReportClick);
    console.log('[事件绑定] 生成报告按钮事件已绑定');
  }
  
  // 搜索功能
  const weeklySearchBtn = document.getElementById('weekly-search-btn');
  if (weeklySearchBtn) {
    weeklySearchBtn.addEventListener('click', handleWeeklySearchClick);
    console.log('[事件绑定] 搜索按钮事件已绑定');
  }
  
  const weeklySearchInput = document.getElementById('weekly-search-input');
  if (weeklySearchInput) {
    weeklySearchInput.addEventListener('keypress', function(e) {
      if (e.key === 'Enter') {
        handleWeeklySearchClick();
      }
    });
    console.log('[事件绑定] 搜索输入框回车事件已绑定');
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
  // 同步逻辑保持不变
  await syncOfflineQueue();
}

async function handleWeeklyReportClick() {
  console.log('=== 周报按钮点击 ===');
  uiManager.showWeeklyReportPage();
  await generateCurrentWeekReport();
}

async function handleWeeklyFavoriteClick() {
  console.log('=== 周报收藏按钮点击 ===');
  uiManager.showWeeklyReportPage();
}

function handleBackToMainClick() {
  console.log('=== 返回主页面按钮点击 ===');
  uiManager.showMainPage();
}

async function handleGenerateReportClick() {
  console.log('=== 生成报告按钮点击 ===');
  await generateCurrentWeekReport();
}

async function handleWeeklySearchClick() {
  console.log('=== 搜索按钮点击 ===');
  await performWeeklySearch();
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
    const truncatedText = text.length > 100 ? text.substring(0, 100) + '...' : text;
    
    html += `
      <div class="collection-item" data-id="${collectId}">
        <div class="collection-header">
          <span class="collection-category">${category}</span>
          <span class="collection-time">${createdAt}</span>
        </div>
        <div class="collection-content">${truncatedText}</div>
        ${url ? `<div class="collection-url"><a href="${url}" target="_blank" title="${url}">🔗 ${url}</a></div>` : ''}
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

// 同步离线队列（保持原有逻辑）
async function syncOfflineQueue() {
  console.log('=== 同步离线队列 ===');
  
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

// 周报相关功能（保持原有逻辑）
async function generateCurrentWeekReport() {
  console.log('=== 生成当前周报 ===');
  
  const generateBtn = document.getElementById('generate-report-btn');
  const reportsContainer = document.getElementById('weekly-reports-container');
  
  if (generateBtn) {
    generateBtn.disabled = true;
  }
  
  if (reportsContainer) {
    reportsContainer.innerHTML = '<div class="loading">正在生成周报...</div>';
  }
  
  try {
    const userInfo = await loginManager.getUserInfo();
    
    if (!userInfo.isLoggedIn) {
      throw new Error('用户未登录');
    }
    
    const response = await chrome.runtime.sendMessage({
      action: 'generateWeeklyReport',
      userId: userInfo.userId
    });
    
    if (response && response.success && response.data) {
      renderWeeklyReport(response.data);
    } else {
      reportsContainer.innerHTML = '<div class="empty">暂无本周收藏数据</div>';
    }
    
  } catch (error) {
    console.error('生成周报失败:', error);
    if (reportsContainer) {
      reportsContainer.innerHTML = `<div class="error">生成失败: ${error.message}</div>`;
    }
  } finally {
    if (generateBtn) {
      generateBtn.disabled = false;
    }
  }
}

function renderWeeklyReport(report) {
  const reportsContainer = document.getElementById('weekly-reports-container');
  if (!reportsContainer || !report) return;
  
  const startDate = new Date(report.week_start);
  const endDate = new Date(report.week_end);
  const dateRange = `${(startDate.getMonth() + 1)}/${startDate.getDate()} - ${(endDate.getMonth() + 1)}/${endDate.getDate()}`;
  
  reportsContainer.innerHTML = `
    <div class="weekly-report-card">
      <div class="report-header">
        <h3>📊 本周周报</h3>
        <span class="report-time">${dateRange}</span>
      </div>
      
      <div class="report-summary">
        <p>${report.summary || '本周暂无收藏内容'}</p>
      </div>
      
      <div class="report-stats">
        <div class="stat-item">
          <span class="stat-value">${report.total_count || 0}</span>
          <span class="stat-label">总收藏</span>
        </div>
        <div class="stat-item">
          <span class="stat-value">${report.favorite_count || 0}</span>
          <span class="stat-label">已分类</span>
        </div>
      </div>
      
      ${report.top_keywords && report.top_keywords.length > 0 ? `
        <div class="report-section">
          <h4>🔑 热门关键词</h4>
          <div class="keyword-cloud">
            ${report.top_keywords.map((kw, idx) => `
              <span class="keyword-tag" style="font-size: ${Math.max(12, 16 - idx * 2)}px;">${kw}</span>
            `).join('')}
          </div>
        </div>
      ` : ''}
      
      ${report.top_categories && report.top_categories.length > 0 ? `
        <div class="report-section">
          <h4>📁 主要分类</h4>
          <div class="category-list">
            ${report.top_categories.map(cat => `
              <span class="category-badge">${cat}</span>
            `).join('')}
          </div>
        </div>
      ` : ''}
      
      <div class="report-footer">
        <span class="report-id">报告 ID: ${report.report_id || 'N/A'}</span>
        <span class="report-created">生成时间: ${new Date(report.created_at).toLocaleString('zh-CN')}</span>
      </div>
    </div>
  `;
}

async function performWeeklySearch() {
  console.log('=== 执行周报搜索 ===');
  
  const keyword = document.getElementById('weekly-search-input')?.value.trim();
  const exactMatch = document.getElementById('weekly-exact-match')?.checked;
  const favoritesOnly = document.getElementById('weekly-favorites-only')?.checked;
  const resultsContainer = document.getElementById('weekly-search-results');
  const resultsList = document.getElementById('weekly-results-list');
  const resultCount = document.getElementById('weekly-result-count');
  
  if (!keyword) {
    if (resultsContainer) resultsContainer.style.display = 'none';
    return;
  }
  
  if (resultsContainer) {
    resultsContainer.style.display = 'block';
  }
  
  if (resultsList) {
    resultsList.innerHTML = '<div class="loading">搜索中...</div>';
  }
  
  try {
    const userInfo = await loginManager.getUserInfo();
    
    if (!userInfo.isLoggedIn) {
      throw new Error('用户未登录');
    }
    
    const response = await chrome.runtime.sendMessage({
      action: 'searchWeeklyCollections',
      keyword: keyword,
      exactMatch: exactMatch,
      favoritesOnly: favoritesOnly,
      userId: userInfo.userId
    });
    
    if (response && response.success && response.data) {
      const results = response.data.items || response.data;
      const total = response.data.total || results.length;
      
      if (resultCount) {
        resultCount.textContent = `找到 ${total} 条结果`;
      }
      
      if (results.length > 0) {
        renderSearchResults(results, resultsList);
      } else {
        if (resultsList) {
          resultsList.innerHTML = '<div class="empty">未找到相关收藏</div>';
        }
      }
    } else {
      if (resultsList) {
        resultsList.innerHTML = '<div class="empty">搜索失败</div>';
      }
    }
    
  } catch (error) {
    console.error('搜索失败:', error);
    if (resultsList) {
      resultsList.innerHTML = `<div class="error">搜索失败: ${error.message}</div>`;
    }
  }
}

function renderSearchResults(results, container) {
  if (!container) return;
  
  let html = '';
  
  results.forEach(item => {
    const text = item.original_text || '无内容';
    const url = item.url || '';
    const keywords = item.ai_keywords || item.keywords || [];
    const category = item.ai_category || item.category || '未分类';
    const createdAt = item.created_at ? 
      new Date(item.created_at).toLocaleString('zh-CN') : '未知时间';
    
    const truncatedText = text.length > 150 ? text.substring(0, 150) + '...' : text;
    
    html += `
      <div class="search-result-item">
        <div class="result-header">
          <span class="result-category">${category}</span>
          <span class="result-time">${createdAt}</span>
        </div>
        <div class="result-content">${truncatedText}</div>
        ${url ? `<div class="result-url"><a href="${url}" target="_blank" title="${url}">🔗 ${url}</a></div>` : ''}
        ${keywords.length > 0 ? `
          <div class="result-keywords">
            ${keywords.map(kw => `<span class="keyword-tag">${kw}</span>`).join('')}
          </div>
        ` : ''}
      </div>
    `;
  });
  
  container.innerHTML = html;
}

// 全局错误处理
window.addEventListener('error', function(event) {
  console.error('全局错误:', event.error);
  console.error('错误信息:', event.message);
  console.error('错误文件:', event.filename);
  console.error('错误行号:', event.lineno);
  console.error('错误列号:', event.colno);
});

window.addEventListener('unhandledrejection', function(event) {
  console.error('未处理的Promise拒绝:', event.reason);
  console.error('错误堆栈:', event.reason?.stack);
});