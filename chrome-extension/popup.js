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
  
  // 绑定事件 - 确保元素存在后再绑定
  setTimeout(() => {
    const loginBtn = document.getElementById('login-btn');
    const logoutBtn = document.getElementById('logout-btn');
    const syncBtn = document.getElementById('sync-btn');
    const weeklyReportBtn = document.getElementById('weekly-report-btn');
    const backToMainBtn = document.getElementById('back-to-main');
    const generateReportBtn = document.getElementById('generate-report-btn');
    
    if (loginBtn) loginBtn.addEventListener('click', handleLogin);
    if (logoutBtn) logoutBtn.addEventListener('click', handleLogout);
    if (syncBtn) syncBtn.addEventListener('click', syncOfflineQueue);
    if (weeklyReportBtn) weeklyReportBtn.addEventListener('click', showWeeklyReport);
    if (backToMainBtn) backToMainBtn.addEventListener('click', backToMainPage);
    if (generateReportBtn) generateReportBtn.addEventListener('click', generateCurrentWeekReport);
  }, 100);
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
    
    console.log('Collections response:', response);
    
    console.log('Collections API response:', response);
    
    if (response.success && response.data) {
      // 处理不同的响应格式
      let collections = [];
      let total = 0;
      
      if (Array.isArray(response.data)) {
        // 格式1: 直接返回数组
        collections = response.data;
        total = response.data.length;
      } else if (response.data.data && Array.isArray(response.data.data)) {
        // 格式2: 嵌套data字段
        collections = response.data.data;
        total = response.data.total || response.data.data.length;
      } else if (Array.isArray(response.data.collections)) {
        // 格式3: collections字段
        collections = response.data.collections;
        total = response.data.total || response.data.collections.length;
      }
      
      if (collections.length > 0) {
        renderCollections(collections);
        document.getElementById('total-count').textContent = total;
      } else {
        listEl.innerHTML = '<div class="empty">暂无收藏</div>';
      }
    } else {
      listEl.innerHTML = '<div class="empty">暂无收藏</div>';
    }
  } catch (error) {
    console.error('Load collections error:', error);
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
        <span class="collection-status status-${(item.status || 'PENDING').toLowerCase()}">${getStatusText(item.status || 'PENDING')}</span>
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
  // 确保status不是undefined或null
  const normalizedStatus = status || 'PENDING';
  const statusMap = {
    'PENDING': '待分析',
    'ANALYZED': '已分析',
    'AI_FAILED': '分析失败'
  };
  return statusMap[normalizedStatus] || normalizedStatus;
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

// ========== 周报功能 ==========

// 显示周报页面
async function showWeeklyReport() {
  try {
    // 检查登录状态
    const storage = await chrome.storage.local.get(['isLoggedIn', 'userId']);
    
    if (!storage.isLoggedIn || !storage.userId) {
      alert('请先登录以查看周报');
      return;
    }
    
    // 显示周报页面
    document.getElementById('login-page').style.display = 'none';
    document.getElementById('main-page').style.display = 'none';
    document.getElementById('weekly-report-page').style.display = 'block';
    
    // 加载周报数据
    await loadWeeklyReports(storage.userId);
    
  } catch (error) {
    console.error('显示周报失败:', error);
    alert('加载周报失败，请重试');
  }
}

// 加载周报数据
async function loadWeeklyReports(userId) {
  const container = document.getElementById('weekly-reports-container');
  container.innerHTML = '<div class="loading">加载周报中...</div>';
  
  try {
    console.log('开始加载周报数据，用户ID:', userId);
    
    // 使用Promise包装chrome.runtime.sendMessage
    const response = await new Promise((resolve, reject) => {
      chrome.runtime.sendMessage({
        action: 'getWeeklyReports',
        userId: userId,
        page: 1,
        size: 10
      }, (response) => {
        if (chrome.runtime.lastError) {
          reject(new Error(chrome.runtime.lastError.message));
        } else {
          resolve(response);
        }
      });
    });
    
    console.log('收到周报响应:', response);
    
    if (response && response.success) {
      console.log('周报数据加载成功，报告数量:', response.reports ? response.reports.length : 0);
      renderWeeklyReports(response.reports, response.current_week_report);
    } else {
      const errorMsg = response ? (response.error || response.message || '未知错误') : '响应为空';
      console.error('周报加载失败:', errorMsg);
      container.innerHTML = '<div class="error">加载周报失败: ' + errorMsg + '</div>';
    }
  } catch (error) {
    console.error('加载周报失败:', error);
    container.innerHTML = '<div class="error">加载周报失败: ' + error.message + '</div>';
  }
}

// 渲染周报列表
function renderWeeklyReports(reports, currentWeekReport) {
  const container = document.getElementById('weekly-reports-container');
  
  if (!reports || reports.length === 0) {
    container.innerHTML = `
      <div class="empty">
        <div class="empty-icon">📊</div>
        <p>暂无周报数据</p>
        <button id="generate-current-report" class="primary-btn">生成本周周报</button>
      </div>
    `;
    
    document.getElementById('generate-current-report').addEventListener('click', generateCurrentWeekReport);
    return;
  }
  
  let html = '<div class="weekly-reports-list">';
  
  // 显示当前周报（如果有）
  if (currentWeekReport) {
    html += `
      <div class="current-week-report">
        <h3>📅 本周周报</h3>
        ${renderWeeklyReportItem(currentWeekReport, true)}
      </div>
    `;
  }
  
  // 显示历史周报
  if (reports.length > 0) {
    html += '<div class="historical-reports">';
    html += '<h3>📚 历史周报</h3>';
    
    reports.forEach(report => {
      // 跳过当前周报（如果已显示）
      if (currentWeekReport && report.report_id === currentWeekReport.report_id) {
        return;
      }
      html += renderWeeklyReportItem(report);
    });
    
    html += '</div>';
  }
  
  html += '</div>';
  container.innerHTML = html;
  
  // 添加查看详情事件
  document.querySelectorAll('.view-report-detail').forEach(btn => {
    btn.addEventListener('click', function() {
      const reportId = this.getAttribute('data-report-id');
      viewReportDetail(reportId);
    });
  });
}

// 渲染单个周报项
function renderWeeklyReportItem(report, isCurrent = false) {
  const reportData = report.report_data || {};
  const summary = reportData.summary || {};
  
  return `
    <div class="weekly-report-item ${isCurrent ? 'current' : ''}">
      <div class="report-header">
        <span class="report-date">${report.week_start} 至 ${report.week_end}</span>
        ${isCurrent ? '<span class="current-badge">当前</span>' : ''}
      </div>
      <div class="report-stats">
        <div class="stat">
          <span class="stat-value">${summary.total_collections || 0}</span>
          <span class="stat-label">收藏</span>
        </div>
        <div class="stat">
          <span class="stat-value">${Object.keys(summary.categories || {}).length}</span>
          <span class="stat-label">分类</span>
        </div>
        <div class="stat">
          <span class="stat-value">${summary.reading_time_total || 0}</span>
          <span class="stat-label">分钟</span>
        </div>
      </div>
      <div class="report-preview">
        <div class="top-categories">
          ${(summary.top_keywords || []).slice(0, 3).map(keyword => 
            `<span class="keyword-tag">${keyword}</span>`
          ).join('')}
        </div>
      </div>
      <button class="view-report-detail" data-report-id="${report.report_id}">
        查看详情
      </button>
    </div>
  `;
}

// 生成本周周报
async function generateCurrentWeekReport() {
  try {
    const storage = await chrome.storage.local.get(['userId']);
    if (!storage.userId) {
      alert('请先登录');
      return;
    }
    
    const generateBtn = document.getElementById('generate-current-report');
    generateBtn.textContent = '生成中...';
    generateBtn.disabled = true;
    
    const response = await chrome.runtime.sendMessage({
      action: 'generateCurrentWeekReport',
      userId: storage.userId
    });
    
    if (response.success) {
      alert('周报生成成功！');
      await loadWeeklyReports(storage.userId);
    } else {
      alert('周报生成失败: ' + (response.error || '未知错误'));
    }
    
  } catch (error) {
    console.error('生成周报失败:', error);
    alert('生成周报失败: ' + error.message);
  } finally {
    const generateBtn = document.getElementById('generate-current-report');
    if (generateBtn) {
      generateBtn.textContent = '生成本周周报';
      generateBtn.disabled = false;
    }
  }
}

// 查看周报详情
async function viewReportDetail(reportId) {
  try {
    const response = await chrome.runtime.sendMessage({
      action: 'getWeeklyReportDetail',
      reportId: reportId
    });
    
    if (response.success) {
      showReportDetailModal(response.report, response.collections);
    } else {
      alert('加载周报详情失败: ' + (response.error || '未知错误'));
    }
  } catch (error) {
    console.error('查看周报详情失败:', error);
    alert('查看周报详情失败: ' + error.message);
  }
}

// 显示周报详情模态框
function showReportDetailModal(report, collections) {
  // 这里可以扩展为显示详细的周报内容
  // 由于popup尺寸限制，这里简化显示
  const reportData = report.report_data || {};
  const summary = reportData.summary || {};
  
  const modalContent = `
    <div class="report-detail-modal">
      <h3>📊 周报详情 - ${report.week_start} 至 ${report.week_end}</h3>
      <div class="detail-stats">
        <p><strong>总收藏数:</strong> ${summary.total_collections || 0}</p>
        <p><strong>分类数量:</strong> ${Object.keys(summary.categories || {}).length}</p>
        <p><strong>总阅读时间:</strong> ${summary.reading_time_total || 0} 分钟</p>
      </div>
      <div class="detail-content">
        <h4>热门关键词</h4>
        <div class="keywords-cloud">
          ${(summary.top_keywords || []).map(keyword => 
            `<span class="keyword-bubble">${keyword}</span>`
          ).join('')}
        </div>
      </div>
      <button class="close-modal">关闭</button>
    </div>
  `;
  
  // 创建模态框
  const modal = document.createElement('div');
  modal.className = 'modal-overlay';
  modal.innerHTML = modalContent;
  
  // 添加到页面
  document.body.appendChild(modal);
  
  // 关闭事件
  modal.querySelector('.close-modal').addEventListener('click', () => {
    document.body.removeChild(modal);
  });
  
  // 点击背景关闭
  modal.addEventListener('click', (e) => {
    if (e.target === modal) {
      document.body.removeChild(modal);
    }
  });
}

// 返回主页面
function backToMainPage() {
  document.getElementById('login-page').style.display = 'none';
  document.getElementById('weekly-report-page').style.display = 'none';
  document.getElementById('main-page').style.display = 'block';
}

// 监听来自background的消息
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'collectionAdded') {
    // 收藏添加后刷新列表
    setTimeout(() => {
      loadCollections();
      checkOfflineQueue();
    }, 1000); // 延迟1秒，确保后端有时间处理
  }
});
