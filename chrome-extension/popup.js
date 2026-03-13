// popup.js - Popup 界面逻辑
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
  errorEl.textContent = '';
  
  try {
    console.log('=== 开始登录流程 ===');
    console.log('用户名:', username);
    
    // 使用 Promise 包装消息发送，添加超时处理
    const response = await new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error('登录请求超时，请检查后端服务是否正在运行'));
      }, 20000); // 20 秒超时（考虑重试时间）
      
      chrome.runtime.sendMessage({
        action: 'login',
        username,
        password
      }, (response) => {
        clearTimeout(timeout);
        if (chrome.runtime.lastError) {
          console.error('Chrome runtime error:', chrome.runtime.lastError);
          reject(new Error(chrome.runtime.lastError.message));
        } else {
          resolve(response);
        }
      });
    });
    
    console.log('登录响应:', response);
    
    // 检查响应
    if (!response) {
      throw new Error('未收到服务器响应');
    }
    
    if (response.success) {
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
      console.error('登录失败:', response?.error || response?.message || '未知错误');
      const errorMsg = response?.error || response?.message || '登录失败，请检查用户名和密码';
      errorEl.textContent = errorMsg;
      errorEl.style.display = 'block';
    }
  } catch (error) {
    console.error('=== 登录异常 ===');
    console.error('错误类型:', error.name);
    console.error('错误消息:', error.message);
    
    // 处理不同类型的错误
    let errorMsg = '登录失败';
    
    if (error.name === 'LoginError' || error.message) {
      errorMsg = error.message;
    } else if (error.name === 'AbortError') {
      errorMsg = '登录请求被取消，请重试';
    } else if (chrome.runtime.lastError) {
      errorMsg = '扩展通信错误：' + chrome.runtime.lastError.message;
    } else {
      errorMsg = '网络连接失败，请确保后端服务正在运行 (http://localhost:8000)';
    }
    
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

// 加载收藏列表
async function loadCollections() {
  const listEl = document.getElementById('collections-list');
  listEl.innerHTML = '<div class="loading">加载中...</div>';
  
  try {
    // 获取当前用户 ID
    const storage = await chrome.storage.local.get(['userId']);
    const userId = storage.userId;
    
    // 添加超时处理
    const response = await new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error('加载收藏列表超时，请检查网络连接'));
      }, 15000); // 15 秒超时（考虑重试时间）
      
      chrome.runtime.sendMessage({
        action: 'getCollections',
        page: 1,
        size: 20,
        userId: userId  // 传递 userId
      }, (response) => {
        clearTimeout(timeout);
        if (chrome.runtime.lastError) {
          reject(new Error(chrome.runtime.lastError.message));
        } else {
          resolve(response);
        }
      });
    });
    
    console.log('Collections response:', response);
    
    if (response.success) {
      // 处理不同的响应格式
      let collections = []
      let total = 0
      
      if (response.items && Array.isArray(response.items)) {
        // 格式 1: items 字段（FastAPI 默认格式）
        collections = response.items
        total = response.total || response.items.length
      } else if (response.data && Array.isArray(response.data)) {
        // 格式 2: 直接返回数组
        collections = response.data
        total = response.data.length
      } else if (response.data && response.data.data && Array.isArray(response.data.data)) {
        // 格式 3: 嵌套 data 字段
        collections = response.data.data
        total = response.data.total || response.data.data.length
      } else if (response.collections && Array.isArray(response.collections)) {
        // 格式 4: collections 字段
        collections = response.collections
        total = response.total || response.collections.length
      }
      
      if (collections.length > 0) {
        renderCollections(collections)
        document.getElementById('total-count').textContent = total
      } else {
        listEl.innerHTML = '<div class="empty">暂无收藏</div>'
      }
    } else {
      listEl.innerHTML = '<div class="empty">暂无收藏</div>'
    }
  } catch (error) {
    console.error('Load collections error:', error)
    listEl.innerHTML = '<div class="error">加载失败：' + error.message + '</div>'
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
  
  // 显示加载状态
  generateBtn.disabled = true;
  reportsContainer.innerHTML = '<div class="loading">正在生成周报...</div>';
  
  try {
    // 获取用户信息
    const storage = await chrome.storage.local.get(['userId', 'token']);
    const userId = storage.userId;
    
    console.log('开始生成周报，用户 ID:', userId);
    
    // 首先获取本周收藏列表
    console.log('获取本周收藏列表...');
    const collectionsResponse = await new Promise((resolve, reject) => {
      chrome.runtime.sendMessage({
        action: 'getCollections',
        page: 1,
        size: 100 // 获取更多收藏用于分析
      }, (response) => {
        if (chrome.runtime.lastError) {
          reject(new Error(chrome.runtime.lastError.message));
        } else {
          resolve(response);
        }
      });
    });
    
    console.log('收藏列表响应:', collectionsResponse);
    
    // 筛选本周收藏
    const thisWeekStart = new Date();
    thisWeekStart.setDate(thisWeekStart.getDate() - thisWeekStart.getDay());
    thisWeekStart.setHours(0, 0, 0, 0);
    
    let weekCollections = [];
    if (collectionsResponse && collectionsResponse.success) {
      let collections = [];
      if (collectionsResponse.items && Array.isArray(collectionsResponse.items)) {
        collections = collectionsResponse.items;
      } else if (collectionsResponse.data && Array.isArray(collectionsResponse.data)) {
        collections = collectionsResponse.data;
      }
      
      // 筛选本周收藏
      weekCollections = collections.filter(item => {
        const createdAt = new Date(item.created_at);
        return createdAt >= thisWeekStart;
      });
    }
    
    console.log('本周收藏数量:', weekCollections.length);
    
    // 深度分析收藏内容
    const contentAnalysis = analyzeCollectionsContent(weekCollections);
    console.log('收藏内容分析:', contentAnalysis);
    
    // 调用后端 API 生成周报
    const response = await new Promise((resolve, reject) => {
      chrome.runtime.sendMessage({
        action: 'generateWeeklyReport',
        userId: userId
      }, (response) => {
        if (chrome.runtime.lastError) {
          reject(new Error(chrome.runtime.lastError.message));
        } else {
          resolve(response);
        }
      });
    });
    
    console.log('周报生成响应:', response);
    
    if (response && response.success && response.data) {
      const report = response.data;
      
      // 获取趋势分析
      const trendAnalysis = getTrendAnalysis(contentAnalysis.dailyStats);
      
      // 显示增强版周报内容
      reportsContainer.innerHTML = `
        <div class="weekly-report-card">
          <div class="report-header">
            <h3>📊 本周收藏分析报告</h3>
            <span class="report-time">${formatDateRange(report.week_start, report.week_end)}</span>
          </div>
          
          <div class="report-summary enhanced-summary">
            <div class="summary-text">
              <p>${contentAnalysis.summary}</p>
              <div class="trend-indicator ${trendAnalysis.trendClass}">
                ${trendAnalysis.trend}
              </div>
            </div>
          </div>
          
          <div class="report-stats enhanced-stats">
            <div class="stat-item">
              <span class="stat-value">${report.total_count}</span>
              <span class="stat-label">总收藏</span>
            </div>
            <div class="stat-item">
              <span class="stat-value">${report.favorite_count}</span>
              <span class="stat-label">已分析</span>
            </div>
            <div class="stat-item">
              <span class="stat-value">${weekCollections.length}</span>
              <span class="stat-label">本周新增</span>
            </div>
            <div class="stat-item">
              <span class="stat-value">${Object.keys(contentAnalysis.categories).length}</span>
              <span class="stat-label">分类数</span>
            </div>
          </div>
          
          ${Object.keys(contentAnalysis.contentTypes).length > 0 ? `
            <div class="report-section">
              <h4>📊 内容类型分布</h4>
              <div class="content-type-chart">
                ${Object.entries(contentAnalysis.contentTypes).map(([type, count]) => `
                  <div class="chart-item">
                    <span class="chart-label">${type}</span>
                    <div class="chart-bar">
                      <div class="chart-fill" style="width: ${(count / weekCollections.length * 100)}%"></div>
                    </div>
                    <span class="chart-value">${count}</span>
                  </div>
                `).join('')}
              </div>
            </div>
          ` : ''}
          
          ${Object.keys(contentAnalysis.categories).length > 0 ? `
            <div class="report-section">
              <h4>📁 分类统计</h4>
              <div class="category-grid">
                ${Object.entries(contentAnalysis.categories)
                  .sort(([,a], [,b]) => b - a)
                  .slice(0, 6)
                  .map(([category, count]) => `
                    <div class="category-stat-item">
                      <span class="category-name">${category}</span>
                      <span class="category-count">${count}</span>
                    </div>
                  `).join('')}
              </div>
            </div>
          ` : ''}
          
          ${Object.keys(contentAnalysis.keywords).length > 0 ? `
            <div class="report-section">
              <h4>🔑 热门关键词</h4>
              <div class="keyword-analysis">
                <div class="keyword-cloud">
                  ${Object.entries(contentAnalysis.keywords)
                    .sort(([,a], [,b]) => b - a)
                    .slice(0, 12)
                    .map(([keyword, count], index) => `
                      <span class="keyword-tag clickable-keyword" 
                            style="font-size: ${Math.max(12, 20 - index * 1)}px;"
                            data-keyword="${keyword}"
                            data-count="${count}"
                            onclick="searchKeyword('${keyword}')"
                            title="${keyword} (${count}次)">
                        ${keyword}
                        <span class="keyword-count">${count}</span>
                      </span>
                    `).join('')}
                </div>
                <div class="keyword-insights">
                  <p>共整理出 <strong>${Object.keys(contentAnalysis.keywords).length}</strong> 个关键词，
                  其中 "${Object.entries(contentAnalysis.keywords).sort(([,a], [,b]) => b - a)[0][0]}" 出现频率最高。</p>
                </div>
              </div>
            </div>
          ` : ''}
          
          ${Object.keys(contentAnalysis.sources).length > 0 ? `
            <div class="report-section">
              <h4>🌐 内容来源分析</h4>
              <div class="source-analysis">
                ${Object.entries(contentAnalysis.sources)
                  .sort(([,a], [,b]) => b - a)
                  .slice(0, 5)
                  .map(([source, count]) => `
                    <div class="source-item">
                      <span class="source-name">${source}</span>
                      <div class="source-bar">
                        <div class="source-fill" style="width: ${(count / weekCollections.length * 100)}%"></div>
                      </div>
                      <span class="source-count">${count}</span>
                    </div>
                  `).join('')}
              </div>
            </div>
          ` : ''}
          
          ${Object.keys(contentAnalysis.dailyStats).length > 0 ? `
            <div class="report-section">
              <h4>📈 每日收藏趋势</h4>
              <div class="daily-trend">
                <div class="trend-summary">
                  <span class="trend-text ${trendAnalysis.trendClass}">${trendAnalysis.trend}</span>
                  <span class="trend-detail">前半周平均 ${trendAnalysis.firstAvg} 条/天，后半周平均 ${trendAnalysis.secondAvg} 条/天</span>
                </div>
                <div class="daily-bars">
                  ${Object.entries(contentAnalysis.dailyStats)
                    .sort(([a], [b]) => new Date(a) - new Date(b))
                    .map(([date, count]) => {
                      const maxCount = Math.max(...Object.values(contentAnalysis.dailyStats));
                      const height = (count / maxCount * 100);
                      return `
                        <div class="day-bar">
                          <div class="bar" style="height: ${height}%" title="${date}: ${count}条"></div>
                          <span class="day-label">${date.split('/').slice(1).join('/')}</span>
                          <span class="day-count">${count}</span>
                        </div>
                      `;
                    }).join('')}
                </div>
              </div>
            </div>
          ` : ''}
          
          ${weekCollections.length > 0 ? `
            <div class="report-section">
              <h4>📋 本周精选收藏</h4>
              <div class="featured-collections">
                ${weekCollections
                  .slice(0, 3)
                  .map(item => `
                    <div class="featured-item">
                      <div class="featured-header">
                        <span class="featured-category">${item.ai_category || '未分类'}</span>
                        <span class="featured-time">${new Date(item.created_at).toLocaleString('zh-CN')}</span>
                      </div>
                      <div class="featured-content">${(item.original_text || '').substring(0, 120)}${(item.original_text || '').length > 120 ? '...' : ''}</div>
                      ${item.url ? `<div class="featured-url"><a href="${item.url}" target="_blank" title="${item.url}">🔗 ${new URL(item.url).hostname}</a></div>` : ''}
                      ${item.ai_keywords && item.ai_keywords.length > 0 ? `
                        <div class="featured-keywords">
                          ${item.ai_keywords.slice(0, 3).map(kw => `<span class="keyword-mini">${kw}</span>`).join('')}
                        </div>
                      ` : ''}
                    </div>
                  `).join('')}
              </div>
              ${weekCollections.length > 3 ? `
                <div class="more-collections">
                  <button class="show-more-btn" onclick="showAllWeekCollections()">
                    查看全部 ${weekCollections.length} 条收藏
                  </button>
                </div>
              ` : ''}
            </div>
          ` : ''}
          
          <div class="report-footer">
            <div class="report-meta">
              <span class="report-id">报告 ID: ${report.report_id}</span>
              <span class="report-created">生成时间：${new Date(report.created_at).toLocaleString('zh-CN')}</span>
            </div>
            <div class="report-actions">
              <button class="export-btn" onclick="exportWeeklyReport()">📥 导出报告</button>
              <button class="refresh-btn" onclick="generateCurrentWeekReport()">🔄 重新生成</button>
            </div>
          </div>
        </div>
      `;
    } else {
    } else {
      // 即使没有后端数据，也显示本周收藏统计
      reportsContainer.innerHTML = `
        <div class="weekly-report-card">
          <div class="report-header">
            <h3>📊 本周收藏统计</h3>
            <span class="report-time">${new Date().toLocaleDateString('zh-CN')}</span>
          </div>
          
          <div class="report-summary">
            <p>本周共收藏 ${weekCollections.length} 条内容</p>
          </div>
          
          <div class="report-stats">
            <div class="stat-item">
              <span class="stat-value">${weekCollections.length}</span>
              <span class="stat-label">本周新增</span>
            </div>
          </div>
          
          ${weekCollections.length > 0 ? `
            <div class="report-section">
              <h4>📋 本周收藏内容</h4>
              <div class="week-collections">
                ${weekCollections.slice(0, 5).map(item => `
                  <div class="collection-item-small">
                    <div class="collection-category-small">${item.ai_category || '未分类'}</div>
                    <div class="collection-content-small">${(item.original_text || '').substring(0, 100)}${(item.original_text || '').length > 100 ? '...' : ''}</div>
                    <div class="collection-time-small">${new Date(item.created_at).toLocaleString('zh-CN')}</div>
                  </div>
                `).join('')}
                ${weekCollections.length > 5 ? `<div class="more-items">还有 ${weekCollections.length - 5} 条收藏...</div>` : ''}
              </div>
            </div>
          ` : ''}
          
          <div class="report-footer">
            <span class="report-created">统计时间：${new Date().toLocaleString('zh-CN')}</span>
          </div>
        </div>
      `;
    }
  } catch (error) {
    console.error('生成周报失败:', error);
    reportsContainer.innerHTML = '<div class="error">生成失败：' + error.message + '</div>';
  } finally {
    generateBtn.disabled = false;
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

// 关键词搜索功能
function searchKeyword(keyword) {
  console.log('点击关键词搜索:', keyword);
  
  // 将关键词填入搜索框
  const searchInput = document.getElementById('weekly-search-input');
  if (searchInput) {
    searchInput.value = keyword;
    // 执行搜索
    performWeeklySearch();
  }
}

// 分析收藏内容
function analyzeCollectionsContent(collections) {
  if (!collections || collections.length === 0) {
    return {
      total: 0,
      categories: {},
      keywords: {},
      sources: {},
      dailyStats: {},
      contentTypes: {},
      summary: '暂无收藏内容'
    };
  }

  const analysis = {
    total: collections.length,
    categories: {},
    keywords: {},
    sources: {},
    dailyStats: {},
    contentTypes: {},
    summary: ''
  };

  collections.forEach(item => {
    // 分类统计
    const category = item.ai_category || '未分类';
    analysis.categories[category] = (analysis.categories[category] || 0) + 1;

    // 关键词统计
    if (item.ai_keywords && Array.isArray(item.ai_keywords)) {
      item.ai_keywords.forEach(keyword => {
        analysis.keywords[keyword] = (analysis.keywords[keyword] || 0) + 1;
      });
    }

    // 来源统计
    const url = item.url || '';
    let source = '未知来源';
    if (url) {
      try {
        const domain = new URL(url).hostname;
        source = domain.replace('www.', '');
      } catch (e) {
        source = '本地内容';
      }
    }
    analysis.sources[source] = (analysis.sources[source] || 0) + 1;

    // 每日统计
    const date = new Date(item.created_at).toLocaleDateString('zh-CN');
    analysis.dailyStats[date] = (analysis.dailyStats[date] || 0) + 1;

    // 内容类型统计
    const hasUrl = !!item.url;
    const contentType = hasUrl ? '网页收藏' : '文本收藏';
    analysis.contentTypes[contentType] = (analysis.contentTypes[contentType] || 0) + 1;
  });

  // 生成智能总结
  const topCategory = Object.entries(analysis.categories)
    .sort(([,a], [,b]) => b - a)[0];
  const topKeyword = Object.entries(analysis.keywords)
    .sort(([,a], [,b]) => b - a)[0];
  const topSource = Object.entries(analysis.sources)
    .sort(([,a], [,b]) => b - a)[0];

  let summary = `本周共收藏${analysis.total}条内容`;
  
  if (topCategory) {
    summary += `，主要关注${topCategory[0]}领域`;
  }
  
  if (topKeyword) {
    summary += `，热门关键词包括"${topKeyword[0]}"`;
  }
  
  if (topSource) {
    summary += `，主要来源为${topSource[0]}`;
  }
  
  const avgDaily = Math.round(analysis.total / Math.max(1, Object.keys(analysis.dailyStats).length));
  summary += `，平均每日收藏${avgDaily}条。`;

  analysis.summary = summary;

  return analysis;
}

// 获取趋势分析
function getTrendAnalysis(dailyStats) {
  const dates = Object.keys(dailyStats).sort();
  if (dates.length < 2) {
    return { trend: '数据不足', trendClass: 'trend-stable' };
  }

  const values = dates.map(date => dailyStats[date]);
  const firstHalf = values.slice(0, Math.ceil(values.length / 2));
  const secondHalf = values.slice(Math.ceil(values.length / 2));
  
  const firstAvg = firstHalf.reduce((a, b) => a + b, 0) / firstHalf.length;
  const secondAvg = secondHalf.reduce((a, b) => a + b, 0) / secondHalf.length;
  
  let trend, trendClass;
  if (secondAvg > firstAvg * 1.2) {
    trend = '收藏量上升 📈';
    trendClass = 'trend-up';
  } else if (secondAvg < firstAvg * 0.8) {
    trend = '收藏量下降 📉';
    trendClass = 'trend-down';
  } else {
    trend = '收藏量稳定 📊';
    trendClass = 'trend-stable';
  }

  return { trend, trendClass, firstAvg: Math.round(firstAvg), secondAvg: Math.round(secondAvg) };
}

// 转义正则表达式特殊字符
function escapeRegExp(string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
