// popup.js - Popup 界面逻辑
// 导入登录优化器
import { LoginOptimizer, LoginStateManager } from './login_enhancer.js';

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

// 处理登录 - 使用优化器
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
  errorEl.textContent = '';
  
  try {
    console.log('=== 使用优化器开始登录流程 ===');
    console.log('用户名:', username);
    
    // 使用登录优化器
    const result = await loginStateManager.performLogin(username, password);
    
    console.log('登录结果:', result);
    
    if (result.success) {
      console.log('登录成功，显示主页面');
      showMainPage();
      
      // 异步加载数据，避免阻塞界面
      setTimeout(() => {
        loadCollections().catch(error => {
          console.error('加载收藏列表失败:', error);
        });
        checkOfflineQueue().catch(error => {
          console.error('检查离线队列失败:', error);
        });
      }, 100);
    } else {
      console.error('登录失败:', result.error || '未知错误');
      const errorMsg = result.error || '登录失败，请检查用户名和密码';
      errorEl.textContent = errorMsg;
      errorEl.style.display = 'block';
    }
  } catch (error) {
    console.error('=== 登录异常 ===');
    console.error('错误类型:', error.name);
    console.error('错误消息:', error.message);
    
    // 使用优化器的错误信息
    const errorMsg = error.message || '登录失败，请稍后重试';
    errorEl.textContent = errorMsg;
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

// 加载收藏列表 - 使用重试机制
async function loadCollections() {
  console.log('[loadCollections] 开始加载收藏列表...');
  
  if (collectionLoader.isLoading) {
    console.log('[loadCollections] 正在加载中，跳过重复请求');
    return;
  }
  
  const listEl = document.getElementById('collections-list');
  listEl.innerHTML = '<div class="loading">加载中...</div>';
  
  try {
    // 使用重试机制加载收藏列表
    const result = await collectionLoader.loadWithRetry(async () => {
      return await fetchCollectionsWithTimeout();
    });
    
    console.log('[loadCollections] 加载成功:', result);
    
    if (result.success && result.data) {
      const response = result.data;
      const collections = response.items || response.data || [];
      const total = response.total || collections.length;
      
      console.log(`[loadCollections] 获取到 ${collections.length} 条收藏，总计 ${total} 条`);
      
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
    console.error('[loadCollections] 最终加载失败:', error);
    
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
