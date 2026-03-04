// popup.js - Popup 界面逻辑

/**
 * 登录请求优化器
 * 提供智能重试、超时处理和错误恢复
 */
class LoginOptimizer {
  constructor() {
    this.maxRetries = 3;
    this.baseTimeout = 15000; // 基础超时 15秒
    this.retryDelays = [1000, 2000, 3000]; // 重试等待时间
  }

  /**
   * 优化的登录请求
   */
  async optimizedLogin(username, password) {
    console.log(`[LoginOptimizer] 开始登录优化流程，用户: ${username}`);
    
    for (let attempt = 1; attempt <= this.maxRetries; attempt++) {
      try {
        console.log(`[LoginOptimizer] 登录尝试 ${attempt}/${this.maxRetries}`);
        
        const result = await this.attemptLogin(username, password, attempt);
        
        if (result.success) {
          console.log(`[LoginOptimizer] 登录成功！`);
          return result;
        } else {
          // 如果是认证错误，不重试
          if (result.error?.includes('用户名') || result.error?.includes('密码')) {
            console.log(`[LoginOptimizer] 认证失败，停止重试`);
            return result;
          }
          
          // 其他错误继续重试
          console.log(`[LoginOptimizer] 登录失败，准备重试: ${result.error}`);
          if (attempt < this.maxRetries) {
            await this.delay(this.retryDelays[attempt - 1]);
          }
        }
      } catch (error) {
        console.error(`[LoginOptimizer] 第${attempt}次尝试异常:`, error);
        
        // 最后一次尝试，返回错误
        if (attempt >= this.maxRetries) {
          return {
            success: false,
            error: this.getFriendlyErrorMessage(error)
          };
        }
        
        // 等待后重试
        await this.delay(this.retryDelays[attempt - 1]);
      }
    }
    
    return {
      success: false,
      error: '登录失败，请检查网络连接'
    };
  }

  /**
   * 单次登录尝试
   */
  async attemptLogin(username, password, attempt) {
    const timeout = this.baseTimeout + (attempt - 1) * 5000; // 递增超时
    
    return new Promise((resolve, reject) => {
      const timeoutId = setTimeout(() => {
        console.log(`[LoginOptimizer] 第${attempt}次尝试超时 (${timeout}ms)`);
        reject(new Error(`登录请求超时 (${timeout/1000}秒)`));
      }, timeout);

      chrome.runtime.sendMessage({
        action: 'login',
        username,
        password
      }, (response) => {
        clearTimeout(timeoutId);
        
        if (chrome.runtime.lastError) {
          reject(new Error(`扩展通信错误: ${chrome.runtime.lastError.message}`));
          return;
        }
        
        resolve(response || { success: false, error: '未收到响应' });
      });
    });
  }

  /**
   * 友好的错误信息
   */
  getFriendlyErrorMessage(error) {
    const message = error.message || error.toString();
    
    if (message.includes('timeout')) {
      return '登录超时，请检查网络连接后重试';
    } else if (message.includes('Failed to fetch') || message.includes('网络')) {
      return '网络连接失败，请确保后端服务正在运行';
    } else if (message.includes('扩展通信')) {
      return '扩展通信错误，请重新加载扩展';
    } else if (message.includes('HTTP 5')) {
      return '服务器错误，请稍后重试';
    } else if (message.includes('用户名') || message.includes('密码')) {
      return message; // 保持原始认证错误信息
    } else {
      return '登录失败，请稍后重试';
    }
  }

  /**
   * 延迟函数
   */
  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

/**
 * 登录状态管理器
 */
class LoginStateManager {
  constructor() {
    this.isLoggingIn = false;
    this.currentUser = null;
    this.loginCallbacks = [];
  }

  /**
   * 执行登录
   */
  async performLogin(username, password) {
    if (this.isLoggingIn) {
      console.log('[LoginStateManager] 登录已在进行中，跳过重复请求');
      return { success: false, error: '登录正在进行中' };
    }

    this.isLoggingIn = true;
    
    try {
      const optimizer = new LoginOptimizer();
      const result = await optimizer.optimizedLogin(username, password);
      
      if (result.success) {
        this.currentUser = { username, userId: result.data?.user_id };
        await this.notifyCallbacks('success', result);
      } else {
        await this.notifyCallbacks('error', result);
      }
      
      return result;
    } catch (error) {
      console.error('[LoginStateManager] 登录异常:', error);
      const errorResult = {
        success: false,
        error: '登录过程中发生错误'
      };
      await this.notifyCallbacks('error', errorResult);
      return errorResult;
    } finally {
      this.isLoggingIn = false;
    }
  }

  /**
   * 添加登录回调
   */
  addCallback(callback) {
    this.loginCallbacks.push(callback);
  }

  /**
   * 通知回调
   */
  async notifyCallbacks(status, result) {
    for (const callback of this.loginCallbacks) {
      try {
        await callback(status, result);
      } catch (error) {
        console.error('[LoginStateManager] 回调执行失败:', error);
      }
    }
  }

  /**
   * 获取当前状态
   */
  getStatus() {
    return {
      isLoggingIn: this.isLoggingIn,
      currentUser: this.currentUser
    };
  }

  /**
   * 重置状态
   */
  reset() {
    this.isLoggingIn = false;
    this.currentUser = null;
    this.loginCallbacks = [];
  }
}

// 创建全局实例
const loginStateManager = new LoginStateManager();

// 收藏列表加载器 - 简单的重试机制
class CollectionLoader {
  constructor() {
    this.retryCount = 0;
    this.maxRetries = 3;
    this.isLoading = false;
  }

  async loadWithRetry(fetchFunction) {
    this.retryCount = 0;
    
    while (this.retryCount < this.maxRetries) {
      try {
        console.log(`[CollectionLoader] 尝试 ${this.retryCount + 1}/${this.maxRetries}`);
        const result = await fetchFunction();
        return { success: true, data: result };
      } catch (error) {
        this.retryCount++;
        console.error(`[CollectionLoader] 第${this.retryCount}次尝试失败:`, error.message);
        
        if (this.retryCount >= this.maxRetries) {
          throw new Error(`加载失败 (${this.retryCount}次尝试): ${error.message}`);
        }
        
        // 等待一段时间后重试
        const waitTime = Math.min(1000 * this.retryCount, 3000);
        console.log(`[CollectionLoader] 等待 ${waitTime}ms 后重试...`);
        await this.sleep(waitTime);
      }
    }
  }

  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

/**
 * 获取收藏列表（带超时处理）
 */
async function fetchCollectionsWithTimeout() {
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      reject(new Error('请求超时 (30秒)'));
    }, 30000); // 30秒超时

    chrome.storage.local.get(['userId'], (storage) => {
      const userId = storage.userId;
      
      if (!userId) {
        clearTimeout(timeout);
        reject(new Error('用户未登录'));
        return;
      }

      console.log(`[fetchCollectionsWithTimeout] 获取收藏列表，用户ID: ${userId}`);

      chrome.runtime.sendMessage({
        action: 'getCollections',
        page: 1,
        size: 20,
        userId: userId
      }, (response) => {
        clearTimeout(timeout);

        if (chrome.runtime.lastError) {
          reject(new Error('扩展通信错误: ' + chrome.runtime.lastError.message));
          return;
        }

        if (!response) {
          reject(new Error('未收到服务器响应'));
          return;
        }

        resolve(response);
      });
    });
  });
}

// 创建加载器实例
const collectionLoader = new CollectionLoader();

document.addEventListener('DOMContentLoaded', init);

async function init() {
  // 检查登录状态
  const storage = await chrome.storage.local.get(['isLoggedIn', 'userId', 'token'])
  
  // 确保所有必要的登录信息都存在
  const isFullyLoggedIn = storage.isLoggedIn && storage.userId && storage.token
  
  if (isFullyLoggedIn) {
    showMainPage()
    
    // 异步加载数据，避免阻塞界面
    setTimeout(() => {
      loadCollections().catch(error => {
        console.error('加载收藏列表失败:', error)
      })
      checkOfflineQueue().catch(error => {
        console.error('检查离线队列失败:', error)
      })
    }, 100)
  } else {
    showLoginPage()
  }
  
  // 绑定事件 - 确保元素存在后再绑定
  setTimeout(() => {
    const loginBtn = document.getElementById('login-btn')
    const logoutBtn = document.getElementById('logout-btn')
    const syncBtn = document.getElementById('sync-btn')
    const weeklyFavoriteBtn = document.getElementById('weekly-favorite-btn')
    const weeklyReportBtn = document.getElementById('weekly-report-btn')
    const backToMainBtn = document.getElementById('back-to-main')
    const generateReportBtn = document.getElementById('generate-report-btn')
    
    if (loginBtn) loginBtn.addEventListener('click', handleLogin)
    if (logoutBtn) logoutBtn.addEventListener('click', handleLogout)
    if (syncBtn) syncBtn.addEventListener('click', syncOfflineQueue)
    if (weeklyFavoriteBtn) weeklyFavoriteBtn.addEventListener('click', showWeeklyFavorite)
    if (weeklyReportBtn) weeklyReportBtn.addEventListener('click', showWeeklyReport)
    if (backToMainBtn) backToMainBtn.addEventListener('click', backToMainPage)
    if (generateReportBtn) generateReportBtn.addEventListener('click', generateCurrentWeekReport)
  }, 100)
  
  // 绑定周报页面搜索事件
  setTimeout(() => {
    const weeklySearchBtn = document.getElementById('weekly-search-btn')
    const weeklySearchInput = document.getElementById('weekly-search-input')
    
    if (weeklySearchBtn) weeklySearchBtn.addEventListener('click', performWeeklySearch)
    if (weeklySearchInput) weeklySearchInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') performWeeklySearch()
    })
  }, 200)
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

// 处理登录 - 简化版兼容修复
async function handleLogin() {
  console.log('=== 登录处理开始 ===');
  
  const username = document.getElementById('username').value.trim();
  const password = document.getElementById('password').value.trim();
  const errorEl = document.getElementById('login-error');
  const loginBtn = document.getElementById('login-btn');
  
  if (!username || !password) {
    errorEl.textContent = '请输入用户名和密码';
    errorEl.style.display = 'block';
    return;
  }
  
  // 按钮状态
  loginBtn.textContent = '登录中...';
  loginBtn.disabled = true;
  errorEl.style.display = 'none';
  errorEl.textContent = '';
  
  try {
    console.log('用户名:', username);
    
    // 使用Promise包装消息发送，添加超时处理
    const response = await new Promise((resolve, reject) => {
      // 延长超时时间到45秒（应对服务响应缓慢）
      const timeout = setTimeout(() => {
        reject(new Error('登录请求超时，请检查后端服务是否正在运行'));
      }, 45000);
      
      console.log('发送登录请求到background.js...');
      
      chrome.runtime.sendMessage({
        action: 'login',
        username: username,
        password: password
      }, (response) => {
        clearTimeout(timeout);
        
        if (chrome.runtime.lastError) {
          console.error('Chrome runtime error:', chrome.runtime.lastError);
          reject(new Error('扩展通信错误：' + chrome.runtime.lastError.message));
        } else {
          console.log('收到登录响应:', response);
          resolve(response);
        }
      });
    });
    
    console.log('登录响应结果:', response);
    
    // 检查响应
    if (!response) {
      throw new Error('未收到服务器响应');
    }
    
    if (response.success) {
      console.log('登录成功，准备显示主页面');
      
      // 保存用户信息（简化版）
      await chrome.storage.local.set({
        token: response.token,
        userId: response.user_id,
        isLoggedIn: true,
        username: username
      });
      
      // 显示主页面
      showMainPage();
      
      // 异步加载数据
      setTimeout(() => {
        loadCollections().catch(error => {
          console.error('加载收藏列表失败:', error);
        });
      }, 100);
      
    } else {
      console.error('登录失败:', response?.error || response?.message || '未知错误');
      const errorMsg = response?.error || response?.message || '登录失败，请检查用户名和密码';
      errorEl.textContent = errorMsg;
      errorEl.style.display = 'block';
    }
    
  } catch (error) {
    console.error('=== 登录异常 ===');
    console.error('错误类型:', error.name);
    console.error('错误消息:', error.message);
    console.error('错误堆栈:', error.stack);
    
    // 友好的错误信息
    let errorMsg = error.message || '登录失败';
    
    if (error.message.includes('timeout')) {
      errorMsg = '登录超时，请检查网络连接或稍后重试';
    } else if (error.message.includes('Failed to fetch') || error.message.includes('网络')) {
      errorMsg = '网络连接失败，请确保后端服务正在运行';
    } else if (error.message.includes('扩展通信')) {
      errorMsg = '扩展通信错误，请重新加载扩展';
    }
    
    errorEl.textContent = errorMsg;
    errorEl.style.display = 'block';
    
  } finally {
    // 恢复按钮状态
    loginBtn.textContent = '登录';
    loginBtn.disabled = false;
    console.log('=== 登录处理完成 ===');
  }
}

// 处理退出
async function handleLogout() {
  await chrome.storage.local.clear();
  showLoginPage();
}

// 渲染收藏列表
function renderCollections(collections) {
  const listEl = document.getElementById('collections-list');
  
  if (!collections || collections.length === 0) {
    listEl.innerHTML = '<div class="empty">暂无收藏</div>';
    return;
  }
  
  let html = '';
  
  for (const item of collections) {
    const collectId = item.collect_id || item.id || 'unknown';
    const text = item.original_text || '无内容';
    const url = item.url || '';
    const keywords = item.ai_keywords || item.keywords || [];
    const category = item.ai_category || item.category || '未分类';
    const createdAt = item.created_at ? new Date(item.created_at).toLocaleString('zh-CN') : '未知时间';
    
    // 截断文本，最多显示 100 字
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
  }
  
  listEl.innerHTML = html;
}

// 加载收藏列表 - 使用增强版加载器
async function loadCollections() {
  console.log('[loadCollections] 开始加载收藏列表（增强版）...');
  
  // 使用增强版收藏列表加载器
  if (window.enhancedCollectionLoader) {
    try {
      const result = await window.enhancedCollectionLoader.loadCollections({
        page: 1,
        size: 20,
        forceRefresh: false,
        showLoading: true,
        useCache: true
      });
      
      console.log('[loadCollections] 增强版加载器结果:', result);
      
      if (result.success) {
        const data = result.data;
        const collections = data.items || data.data || [];
        const total = data.total || collections.length;
        
        console.log(`[loadCollections] 获取到 ${collections.length} 条收藏，总计 ${total} 条`);
        
        if (collections.length > 0) {
          renderCollections(collections);
          const totalCountEl = document.getElementById('total-count');
          if (totalCountEl) {
            totalCountEl.textContent = total;
          }
        } else {
          const listEl = document.getElementById('collections-list');
          listEl.innerHTML = '<div class="empty">暂无收藏</div>';
        }
        
        if (result.cached) {
          console.log('[loadCollections] 使用了缓存数据');
        }
        
        return;
      } else {
        throw new Error(result.error || '加载失败');
      }
      
    } catch (error) {
      console.error('[loadCollections] 增强版加载器失败:', error);
      // 回退到原始方法
      console.log('[loadCollections] 回退到原始加载方法...');
    }
  }
  
  // 原始加载方法（回退方案）
  await loadCollectionsOriginal();
}

// 原始加载方法（作为回退）
async function loadCollectionsOriginal() {
  console.log('[loadCollectionsOriginal] 使用原始加载方法...');
  
  if (collectionLoader.isLoading) {
    console.log('[loadCollectionsOriginal] 正在加载中，跳过重复请求');
    return;
  }
  
  const listEl = document.getElementById('collections-list');
  listEl.innerHTML = '<div class="loading">加载中...</div>';
  
  try {
    // 使用重试机制加载收藏列表
    const result = await collectionLoader.loadWithRetry(async () => {
      return await fetchCollectionsWithTimeout();
    });
    
    console.log('[loadCollectionsOriginal] 加载成功:', result);
    
    if (result.success && result.data) {
      const response = result.data;
      const collections = response.items || response.data || [];
      const total = response.total || collections.length;
      
      console.log(`[loadCollectionsOriginal] 获取到 ${collections.length} 条收藏，总计 ${total} 条`);
      
      if (collections.length > 0) {
        renderCollections(collections);
        const totalCountEl = document.getElementById('total-count');
        if (totalCountEl) {
          totalCountEl.textContent = total;
        }
      } else {
        listEl.innerHTML = '<div class="empty">暂无收藏</div>';
      }
    } else {
      throw new Error('加载失败');
    }
    
  } catch (error) {
    console.error('[loadCollectionsOriginal] 最终加载失败:', error);
    
    // 显示最终错误
    listEl.innerHTML = `
      <div class="error">
        <p>❌ 加载失败: ${error.message}</p>
        <small>请检查网络连接或稍后重试</small>
        <button onclick="loadCollections()" class="retry-btn">重试</button>
      </div>
    `;
  }
}

// 原始加载方法 - 作为回退
async function loadCollectionsFallback() {
  console.log('[loadCollectionsFallback] 使用回退方法加载...');
  const listEl = document.getElementById('collections-list');
  listEl.innerHTML = '<div class="loading">加载中...</div>';
  
  try {
    // 获取当前用户 ID
    const storage = await chrome.storage.local.get(['userId']);
    const userId = storage.userId;
    console.log(`[loadCollectionsFallback] 用户ID: ${userId}`);
    
    if (!userId) {
      throw new Error('用户未登录');
    }
    
    // 使用更长的超时时间
    const response = await new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error('加载收藏列表超时，请检查网络连接'));
      }, 45000); // 45 秒超时
      
      chrome.runtime.sendMessage({
        action: 'getCollections',
        page: 1,
        size: 20,
        userId: userId
      }, (response) => {
        clearTimeout(timeout);
        if (chrome.runtime.lastError) {
          reject(new Error('扩展通信错误'));
        } else if (!response) {
          reject(new Error('未收到服务器响应'));
        } else {
          resolve(response);
        }
      });
    });
    
    console.log('[loadCollectionsFallback] 收到响应:', response);
    
    if (response.success) {
      const collections = response.items || response.data || [];
      const total = response.total || collections.length;
      
      if (collections.length > 0) {
        renderCollections(collections);
        const totalCountEl = document.getElementById('total-count');
        if (totalCountEl) {
          totalCountEl.textContent = total;
        }
      } else {
        listEl.innerHTML = '<div class="empty">暂无收藏</div>';
      }
    } else {
      listEl.innerHTML = '<div class="empty">暂无收藏</div>';
    }
    
  } catch (error) {
    console.error('[loadCollectionsFallback] 加载失败:', error);
    
    listEl.innerHTML = `
      <div class="error">
        <p>❌ 加载失败: ${error.message}</p>
        <small>请检查网络连接或稍后重试</small>
        <button onclick="loadCollections()" class="retry-btn">重试</button>
      </div>
    `;
  }
}

// 检查离线队列
async function checkOfflineQueue() {
  const queue = await chrome.storage.local.get(['offlineQueue']);
  const count = queue.offlineQueue ? queue.offlineQueue.length : 0;
  
  if (count > 0) {
    document.getElementById('offline-count').style.display = 'inline';
    document.getElementById('offline-num').textContent = count;
  } else {
    document.getElementById('offline-count').style.display = 'none';
  }
}

// 同步离线队列
async function syncOfflineQueue() {
  const queue = await chrome.storage.local.get(['offlineQueue']);
  
  if (!queue.offlineQueue || queue.offlineQueue.length === 0) {
    alert('没有待同步的离线收藏');
    return;
  }
  
  const syncBtn = document.getElementById('sync-btn');
  syncBtn.disabled = true;
  syncBtn.textContent = '同步中...';
  
  try {
    let successCount = 0;
    let failCount = 0;
    
    for (const item of queue.offlineQueue) {
      try {
        await chrome.runtime.sendMessage({
          action: 'collect',
          text: item.text,
          url: item.url
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
    loadCollections();
    checkOfflineQueue();
  } catch (error) {
    console.error('同步错误:', error);
    alert('同步失败：' + error.message);
  } finally {
    syncBtn.disabled = false;
    syncBtn.textContent = '🔄';
  }
}

// 显示周报页面
function showWeeklyFavorite() {
  document.getElementById('main-page').style.display = 'none';
  document.getElementById('weekly-report-page').style.display = 'block';
}

// 显示周报页面
function showWeeklyReport() {
  document.getElementById('main-page').style.display = 'none';
  document.getElementById('weekly-report-page').style.display = 'block';
  
  // 自动生成本周周报
  generateCurrentWeekReport();
}

// 返回主页面
function backToMainPage() {
  document.getElementById('weekly-report-page').style.display = 'none';
  document.getElementById('main-page').style.display = 'block';
}

// 生成当前周报
async function generateCurrentWeekReport() {
  const generateBtn = document.getElementById('generate-report-btn');
  const reportsContainer = document.getElementById('weekly-reports-container');
  
  console.log('=== 开始生成周报 ===');
  console.log('generateBtn:', generateBtn);
  console.log('reportsContainer:', reportsContainer);
  
  // 显示加载状态
  if (generateBtn) generateBtn.disabled = true;
  if (reportsContainer) reportsContainer.innerHTML = '<div class="loading">正在生成周报...</div>';
  
  try {
    // 获取用户信息
    const storage = await chrome.storage.local.get(['userId', 'token']);
    const userId = storage.userId;
    
    console.log('用户 ID:', userId);
    console.log('Storage:', storage);
    
    if (!userId) {
      throw new Error('未找到用户 ID，请先登录');
    }
    
    console.log('开始调用后端 API 生成周报...');
    
    // 调用后端 API 生成周报
    const response = await new Promise((resolve, reject) => {
      const message = {
        action: 'generateWeeklyReport',
        userId: userId
      };
      
      console.log('发送消息:', message);
      
      chrome.runtime.sendMessage(message, (response) => {
        console.log('收到响应:', response);
        if (chrome.runtime.lastError) {
          console.error('Chrome runtime error:', chrome.runtime.lastError);
          reject(new Error(chrome.runtime.lastError.message));
        } else {
          resolve(response);
        }
      });
    });
    
    console.log('周报生成响应:', response);
    console.log('响应 success:', response?.success);
    console.log('响应 data:', response?.data);
    
    if (response && response.success && response.data) {
      const report = response.data;
      console.log('渲染周报，报告数据:', report);
      
      // 显示周报内容
      reportsContainer.innerHTML = `
        <div class="weekly-report-card">
          <div class="report-header">
            <h3>📊 本周周报</h3>
            <span class="report-time">${formatDateRange(report.week_start, report.week_end)}</span>
          </div>
          
          <div class="report-summary">
            <p>${report.summary}</p>
          </div>
          
          <div class="report-stats">
            <div class="stat-item">
              <span class="stat-value">${report.total_count}</span>
              <span class="stat-label">总收藏</span>
            </div>
            <div class="stat-item">
              <span class="stat-value">${report.favorite_count}</span>
              <span class="stat-label">已分析</span>
            </div>
          </div>
          
          ${report.top_keywords.length > 0 ? `
            <div class="report-section">
              <h4>🔑 热门关键词</h4>
              <div class="keyword-cloud">
                ${report.top_keywords.map((kw, idx) => `
                  <span class="keyword-tag" style="font-size: ${14 - idx * 1}px;">${kw}</span>
                `).join('')}
              </div>
            </div>
          ` : ''}
          
          ${report.top_categories.length > 0 ? `
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
            <span class="report-id">报告 ID: ${report.report_id}</span>
            <span class="report-created">生成时间：${new Date(report.created_at).toLocaleString('zh-CN')}</span>
          </div>
        </div>
      `;
      console.log('周报渲染完成');
    } else {
      console.log('无数据或失败，显示空状态');
      reportsContainer.innerHTML = '<div class="empty">暂无本周收藏数据</div>';
    }
  } catch (error) {
    console.error('生成周报失败:', error);
    console.error('错误堆栈:', error.stack);
    if (reportsContainer) {
      reportsContainer.innerHTML = '<div class="error">生成失败：' + error.message + '</div>';
    }
  } finally {
    if (generateBtn) generateBtn.disabled = false;
    console.log('=== 周报生成结束 ===');
  }
}

// 格式化日期范围
function formatDateRange(start, end) {
  try {
    const startDate = new Date(start);
    const endDate = new Date(end);
    
    const startStr = `${startDate.getMonth() + 1}/${startDate.getDate()}`;
    const endStr = `${endDate.getMonth() + 1}/${endDate.getDate()}`;
    
    return `${startStr} - ${endStr}`;
  } catch (e) {
    return '本周';
  }
}

// 执行周报搜索
async function performWeeklySearch() {
  const keyword = document.getElementById('weekly-search-input').value.trim();
  const exactMatch = document.getElementById('weekly-exact-match').checked;
  const favoritesOnly = document.getElementById('weekly-favorites-only').checked;
  const resultsContainer = document.getElementById('weekly-search-results');
  const resultsList = document.getElementById('weekly-results-list');
  const resultCount = document.getElementById('weekly-result-count');
  
  if (!keyword) {
    alert('请输入搜索关键词');
    return;
  }
  
  console.log('开始搜索，关键词:', keyword);
  
  // 显示加载状态
  resultsContainer.style.display = 'block';
  resultsList.innerHTML = '<div class="loading">搜索中...</div>';
  
  try {
    // 调用后端 API 搜索
    const response = await new Promise((resolve, reject) => {
      chrome.runtime.sendMessage({
        action: 'searchCollections',
        keyword: keyword,
        exactMatch: exactMatch,
        favoritesOnly: favoritesOnly,
        page: 1,
        size: 20
      }, (response) => {
        if (chrome.runtime.lastError) {
          reject(new Error(chrome.runtime.lastError.message));
        } else {
          resolve(response);
        }
      });
    });
    
    console.log('搜索响应:', response);
    
    if (response && response.success) {
      const items = response.items || [];
      const total = response.total || 0;
      
      resultCount.textContent = `共 ${total} 条结果`;
      
      if (items.length > 0) {
        let html = '';
        
        for (const item of items) {
          const text = item.original_text || '无内容';
          const url = item.url || '';
          const keywords = item.ai_keywords || [];
          const category = item.ai_category || '未分类';
          const createdAt = item.created_at ? new Date(item.created_at).toLocaleString('zh-CN') : '';
          
          // 高亮关键词
          const highlightedText = highlightKeyword(text, keyword);
          
          html += `
            <div class="search-result-item">
              <div class="result-header">
                <span class="result-category">${category}</span>
                <span class="result-time">${createdAt}</span>
              </div>
              <div class="result-content">${highlightedText}</div>
              ${url ? `<div class="result-url"><a href="${url}" target="_blank">🔗 ${url}</a></div>` : ''}
              ${keywords.length > 0 ? `
                <div class="result-keywords">
                  ${keywords.map(kw => `<span class="keyword-tag">${kw}</span>`).join('')}
                </div>
              ` : ''}
            </div>
          `;
        }
        
        resultsList.innerHTML = html;
      } else {
        resultsList.innerHTML = '<div class="empty">未找到相关结果</div>';
      }
    } else {
      resultsList.innerHTML = '<div class="error">搜索失败</div>';
    }
  } catch (error) {
    console.error('搜索失败:', error);
    resultsList.innerHTML = '<div class="error">搜索失败：' + error.message + '</div>';
  }
}

// 高亮关键词
function highlightKeyword(text, keyword) {
  if (!text || !keyword) return text;
  
  const regex = new RegExp(`(${escapeRegExp(keyword)})`, 'gi');
  return text.replace(regex, '<mark>$1</mark>');
}

// 转义正则表达式特殊字符
function escapeRegExp(string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
