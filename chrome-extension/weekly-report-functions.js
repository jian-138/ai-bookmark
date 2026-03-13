// 周报功能增强模块

// 导出周报功能
function exportWeeklyReport() {
  const reportContent = document.querySelector('.weekly-report-card');
  if (!reportContent) {
    alert('请先生成周报');
    return;
  }
  
  // 获取报告数据
  const reportData = {
    title: 'AI书签周报',
    generatedAt: new Date().toLocaleString('zh-CN'),
    summary: document.querySelector('.summary-text p')?.textContent || '',
    stats: {},
    collections: []
  };
  
  // 构建导出内容
  let exportText = `# AI书签周报\n\n`;
  exportText += `生成时间: ${reportData.generatedAt}\n\n`;
  exportText += `## 📊 总结\n${reportData.summary}\n\n`;
  
  // 添加统计数据
  const statItems = document.querySelectorAll('.stat-item');
  if (statItems.length > 0) {
    exportText += `## 📈 统计数据\n`;
    statItems.forEach(item => {
      const value = item.querySelector('.stat-value')?.textContent || '';
      const label = item.querySelector('.stat-label')?.textContent || '';
      exportText += `- ${label}: ${value}\n`;
    });
    exportText += '\n';
  }
  
  // 添加分类统计
  const categoryItems = document.querySelectorAll('.category-stat-item');
  if (categoryItems.length > 0) {
    exportText += `## 📁 分类统计\n`;
    categoryItems.forEach(item => {
      const name = item.querySelector('.category-name')?.textContent || '';
      const count = item.querySelector('.category-count')?.textContent || '';
      exportText += `- ${name}: ${count}条\n`;
    });
    exportText += '\n';
  }
  
  // 添加热门关键词
  const keywords = document.querySelectorAll('.clickable-keyword');
  if (keywords.length > 0) {
    exportText += `## 🔑 热门关键词\n`;
    keywords.forEach(kw => {
      const text = kw.textContent.trim();
      exportText += `- ${text}\n`;
    });
    exportText += '\n';
  }
  
  // 创建下载链接
  const blob = new Blob([exportText], { type: 'text/markdown;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `AI书签周报_${new Date().toISOString().split('T')[0]}.md`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
  
  console.log('周报已导出');
}

// 显示本周所有收藏
function showAllWeekCollections() {
  const container = document.getElementById('weekly-reports-container');
  
  // 获取本周收藏数据（从缓存或重新获取）
  chrome.storage.local.get(['weekCollectionsCache'], async (result) => {
    let weekCollections = result.weekCollectionsCache || [];
    
    if (weekCollections.length === 0) {
      // 重新获取收藏数据
      const storage = await chrome.storage.local.get(['userId']);
      const userId = storage.userId;
      
      const response = await new Promise((resolve, reject) => {
        chrome.runtime.sendMessage({
          action: 'getCollections',
          page: 1,
          size: 100
        }, (response) => {
          if (chrome.runtime.lastError) {
            reject(new Error(chrome.runtime.lastError.message));
          } else {
            resolve(response);
          }
        });
      });
      
      if (response && response.success) {
        let collections = [];
        if (response.items && Array.isArray(response.items)) {
          collections = response.items;
        } else if (response.data && Array.isArray(response.data)) {
          collections = response.data;
        }
        
        // 筛选本周收藏
        const thisWeekStart = new Date();
        thisWeekStart.setDate(thisWeekStart.getDate() - thisWeekStart.getDay());
        thisWeekStart.setHours(0, 0, 0, 0);
        
        weekCollections = collections.filter(item => {
          const createdAt = new Date(item.created_at);
          return createdAt >= thisWeekStart;
        });
        
        // 缓存数据
        chrome.storage.local.set({ weekCollectionsCache: weekCollections });
      }
    }
    
    // 显示所有收藏
    if (weekCollections.length > 0) {
      const contentAnalysis = analyzeCollectionsContent(weekCollections);
      
      let html = `
        <div class="weekly-report-card">
          <div class="report-header">
            <h3>📋 本周全部收藏内容</h3>
            <span class="report-time">共 ${weekCollections.length} 条</span>
          </div>
          
          <div class="all-collections-list">
      `;
      
      weekCollections.forEach((item, index) => {
        html += `
          <div class="collection-item-detailed">
            <div class="collection-number">#${index + 1}</div>
            <div class="collection-content-area">
              <div class="collection-header-detailed">
                <span class="collection-category-detailed">${item.ai_category || '未分类'}</span>
                <span class="collection-time-detailed">${new Date(item.created_at).toLocaleString('zh-CN')}</span>
              </div>
              <div class="collection-text-detailed">${(item.original_text || '').substring(0, 200)}${(item.original_text || '').length > 200 ? '...' : ''}</div>
              ${item.url ? `<div class="collection-url-detailed"><a href="${item.url}" target="_blank" title="${item.url}">🔗 ${new URL(item.url).hostname}</a></div>` : ''}
              ${item.ai_keywords && item.ai_keywords.length > 0 ? `
                <div class="collection-keywords-detailed">
                  ${item.ai_keywords.map(kw => `<span class="keyword-detailed" onclick="searchKeyword('${kw}')">${kw}</span>`).join('')}
                </div>
              ` : ''}
            </div>
          </div>
        `;
      });
      
      html += `
          </div>
          <div class="back-to-summary">
            <button class="secondary-btn" onclick="generateCurrentWeekReport()">返回周报摘要</button>
          </div>
        </div>
      `;
      
      container.innerHTML = html;
    } else {
      container.innerHTML = '<div class="empty-state">本周暂无收藏内容</div>';
    }
  });
}

// 将函数添加到全局作用域
window.exportWeeklyReport = exportWeeklyReport;
window.showAllWeekCollections = showAllWeekCollections;