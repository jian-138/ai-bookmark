// weekly-favorite.js - 周报收藏与搜索功�?const API_BASE_URL = 'https://ai-bookmark-production-5ecc.up.railway.app';
let currentUserId = null;
let currentToken = null;

document.addEventListener('DOMContentLoaded', init);

async function init() {
  // 获取登录信息
  const storage = await chrome.storage.local.get(['userId', 'token']);
  currentUserId = storage.userId;
  currentToken = storage.token;
  
  if (!currentUserId || !currentToken) {
    showError('请先登录');
    setTimeout(() => {
      window.close();
    }, 2000);
    return;
  }
  
  // 绑定事件
  document.getElementById('back-btn').addEventListener('click', goBack);
  document.getElementById('refresh-btn').addEventListener('click', refresh);
  document.getElementById('search-btn').addEventListener('click', performSearch);
  document.getElementById('search-input').addEventListener('keypress', (e) => {
    if (e.key === 'Enter') performSearch();
  });
  
  // 检�?URL 参数中的关键�?  const urlParams = new URLSearchParams(window.location.search);
  const keyword = urlParams.get('keyword');
  
  // 加载数据
  loadStatistics();
  loadKeywords();
  
  // 如果有关键词参数，自动填充并搜索
  if (keyword) {
    document.getElementById('search-input').value = keyword;
    // 等待关键词加载完成后搜索
    setTimeout(() => {
      performSearch();
    }, 500);
  }
}

// 返回主页�?function goBack() {
  window.close();
}

// 刷新
function refresh() {
  loadStatistics();
  loadKeywords();
  document.getElementById('search-results').innerHTML = '<div class="empty-state">输入关键词开始搜�?/div>';
  document.getElementById('result-count').textContent = '';
}

// 加载统计数据
async function loadStatistics() {
  try {
    const response = await fetchWithAuth(`${API_BASE_URL}/api/v1/weekly/keywords/statistics?user_id=${currentUserId}`);
    const data = await response.json();
    
    if (data.success) {
      document.getElementById('total-keywords').textContent = data.data.total_keywords || 0;
      document.getElementById('total-collections').textContent = data.data.total_collections || 0;
    }
  } catch (error) {
    console.error('加载统计数据失败:', error);
  }
}

// 加载关键�?async function loadKeywords() {
  const cloudEl = document.getElementById('keyword-cloud');
  cloudEl.innerHTML = '<div class="loading-sm">加载�?..</div>';
  
  try {
    const response = await fetchWithAuth(`${API_BASE_URL}/api/v1/weekly/keywords?user_id=${currentUserId}`);
    const data = await response.json();
    
    if (data.success) {
      displayKeywords(data.keywords);
      
      // 加载收藏数量
      await loadFavoritesCount();
    } else {
      cloudEl.innerHTML = '<div class="empty-state">暂无关键�?/div>';
    }
  } catch (error) {
    console.error('加载关键词失�?', error);
    cloudEl.innerHTML = '<div class="empty-state">加载失败</div>';
  }
}

// 显示关键词云
function displayKeywords(keywords) {
  const cloudEl = document.getElementById('keyword-cloud');
  
  if (!keywords || keywords.length === 0) {
    cloudEl.innerHTML = '<div class="empty-state">暂无关键�?/div>';
    return;
  }
  
  cloudEl.innerHTML = '';
  
  // 限制显示数量
  const displayKeywords = keywords.slice(0, 20);
  
  displayKeywords.forEach(keyword => {
    const tag = document.createElement('span');
    tag.className = 'keyword-tag';
    tag.textContent = keyword;
    tag.addEventListener('click', () => {
      document.getElementById('search-input').value = keyword;
      performSearch();
    });
    cloudEl.appendChild(tag);
  });
}

// 加载收藏数量
async function loadFavoritesCount() {
  try {
    const response = await fetchWithAuth(`${API_BASE_URL}/api/v1/weekly/favorites?user_id=${currentUserId}&page=1&page_size=1`);
    const data = await response.json();
    
    if (data.success) {
      document.getElementById('total-favorites').textContent = data.total || 0;
    }
  } catch (error) {
    console.error('加载收藏数量失败:', error);
  }
}

// 执行搜索
async function performSearch() {
  const keyword = document.getElementById('search-input').value.trim();
  
  if (!keyword) {
    showErrorMessage('请输入搜索关键词');
    return;
  }
  
  showLoading(true);
  
  const exactMatch = document.getElementById('exact-match').checked;
  const favoritesOnly = document.getElementById('favorites-only').checked;
  
  try {
    const response = await fetchWithAuth(`${API_BASE_URL}/api/v1/weekly/keywords/search`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        user_id: currentUserId,
        keyword: keyword,
        exact_match: exactMatch,
        favorites_only: favoritesOnly,
        page: 1,
        page_size: 20
      })
    });
    
    const data = await response.json();
    
    if (data.success) {
      displaySearchResults(data);
    } else {
      showErrorMessage('搜索失败');
    }
  } catch (error) {
    console.error('搜索失败:', error);
    showErrorMessage('搜索失败，请稍后重试');
  } finally {
    showLoading(false);
  }
}

// 显示搜索结果
function displaySearchResults(results) {
  const resultsEl = document.getElementById('search-results');
  const countEl = document.getElementById('result-count');
  
  countEl.textContent = `�?${results.total} 条结果`;
  
  if (!results.items || results.items.length === 0) {
    resultsEl.innerHTML = '<div class="empty-state">未找到相关内�?/div>';
    return;
  }
  
  resultsEl.innerHTML = '';
  
  results.items.forEach(item => {
    const card = createResultCard(item);
    resultsEl.appendChild(card);
  });
}

// 创建结果卡片
function createResultCard(item) {
  const card = document.createElement('div');
  card.className = 'result-card';
  
  const collection = item.collection;
  const matchType = item.match_type || 'exact';
  const isFavorite = collection.is_favorite || false;
  
  // 获取匹配的关键词
  let matchedText = '';
  if (item.matched_keyword) {
    matchedText = item.matched_keyword;
  } else if (item.matched_keywords && item.matched_keywords.length > 0) {
    matchedText = item.matched_keywords.join(', ');
  }
  
  card.innerHTML = `
    <div class="result-title">${collection.keywords?.[0] || '未分类内�?}</div>
    <div class="result-content">${escapeHtml(collection.original_text?.substring(0, 100) || '无内�?)}...</div>
    <div class="result-meta">
      <span class="match-badge match-${matchType}">${getMatchTypeText(matchType)}</span>
      <span>📅 ${formatDate(collection.created_at)}</span>
      ${matchedText ? `<span>🏷�?${escapeHtml(matchedText)}</span>` : ''}
    </div>
    <div style="margin-top: 8px;">
      <button class="favorite-btn ${isFavorite ? 'favorited' : ''}" data-collection-id="${collection.id}">
        ${isFavorite ? '已收�? : '�?添加收藏'}
      </button>
    </div>
  `;
  
  // 绑定收藏按钮事件
  const favoriteBtn = card.querySelector('.favorite-btn');
  favoriteBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    toggleFavorite(collection.id, favoriteBtn, collection.keywords || []);
  });
  
  // 卡片点击事件（可选：查看详情�?  card.addEventListener('click', () => {
    showCollectionDetail(collection);
  });
  
  return card;
}

// 切换收藏状�?async function toggleFavorite(collectionId, btn, keywords) {
  if (btn.classList.contains('favorited')) {
    // 取消收藏（需要实现）
    showSuccessMessage('取消收藏功能开发中');
    return;
  }
  
  // 添加收藏
  try {
    const response = await fetchWithAuth(`${API_BASE_URL}/api/v1/weekly/favorites`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        user_id: currentUserId,
        collection_id: collectionId,
        keywords: keywords || ['默认关键�?],
        favorite_note: '从插件添�?
      })
    });
    
    const data = await response.json();
    
    if (data.success) {
      btn.textContent = '已收�?;
      btn.classList.add('favorited');
      showSuccessMessage('收藏成功');
      
      // 更新统计
      loadStatistics();
      loadFavoritesCount();
    } else {
      showErrorMessage('收藏失败�? + (data.message || ''));
    }
  } catch (error) {
    console.error('收藏失败:', error);
    showErrorMessage('收藏失败，请稍后重试');
  }
}

// 显示收藏详情（可选功能）
function showCollectionDetail(collection) {
  // 可以打开新窗口或显示对话�?  console.log('收藏详情:', collection);
  showSuccessMessage('详情功能开发中');
}

// 辅助函数
function showLoading(show) {
  document.getElementById('loading').style.display = show ? 'flex' : 'none';
}

function showErrorMessage(message) {
  showMessage(message, 'error');
}

function showSuccessMessage(message) {
  showMessage(message, 'success');
}

function showMessage(message, type) {
  // 移除现有的消�?  const existingMsg = document.querySelector('.error-message, .success-message');
  if (existingMsg) {
    existingMsg.remove();
  }
  
  const msgEl = document.createElement('div');
  msgEl.className = type === 'error' ? 'error-message' : 'success-message';
  msgEl.textContent = message;
  
  const container = document.querySelector('.container');
  container.insertBefore(msgEl, container.firstChild);
  
  setTimeout(() => {
    msgEl.remove();
  }, 3000);
}

function getMatchTypeText(type) {
  const types = {
    'exact': '精确匹配',
    'fuzzy': '模糊匹配',
    'text': '原文匹配'
  };
  return types[type] || type;
}

function formatDate(dateString) {
  const date = new Date(dateString);
  return date.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  });
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

// 带认证的 fetch
async function fetchWithAuth(url, options = {}) {
  const headers = {
    ...options.headers,
    'Authorization': `Bearer ${currentToken}`
  };
  
  const response = await fetch(url, {
    ...options,
    headers
  });
  
  // 处理 401 未授�?  if (response.status === 401) {
    // 清除登录信息
    await chrome.storage.local.remove(['userId', 'token', 'isLoggedIn']);
    showErrorMessage('登录已过期，请重新登�?);
    setTimeout(() => {
      window.close();
    }, 2000);
  }
  
  return response;
}
