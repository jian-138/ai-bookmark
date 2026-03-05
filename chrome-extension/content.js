// content.js - Content Script for capturing text selection
let selectedText = '';
let floatingButton = null;

// 监听文本选择
document.addEventListener('mouseup', handleTextSelection);
document.addEventListener('keyup', handleTextSelection);

function handleTextSelection() {
  const selection = window.getSelection();
  selectedText = selection.toString().trim();
  
  if (selectedText.length >= 10) {
    showFloatingButton(selection);
  } else {
    hideFloatingButton();
  }
}

// 显示浮动按钮
function showFloatingButton(selection) {
  // 移除旧按钮
  hideFloatingButton();
  
  const range = selection.getRangeAt(0);
  const rect = range.getBoundingClientRect();
  // 创建浮动按钮
  floatingButton = document.createElement('div');
  floatingButton.id = 'ai-bookmark-float-button';
  floatingButton.innerHTML = `
    <svg width="24" height="24" viewBox="0 0 24 24" fill="white">
      <path d="M17 3H7c-1.1 0-2 .9-2 2v16l7-3 7 3V5c0-1.1-.9-2-2-2z"/>
    </svg>
  `;
  floatingButton.title = '收藏到AI书签';
  
  // 设置位置
  floatingButton.style.position = 'absolute';
  floatingButton.style.left = `${rect.left + window.scrollX + (rect.width / 2) - 24}px`;
  floatingButton.style.top = `${rect.top + window.scrollY - 48}px`;
  
  // 点击事件
  floatingButton.addEventListener('click', (e) => {
    e.stopPropagation();
    collectSelectedText();
  });
  
  document.body.appendChild(floatingButton);
  
  // 设置样式
  floatingButton.style.cssText += `
    position: absolute;
    background: #1890ff;
    border-radius: 50%;
    width: 48px;
    height: 48px;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    box-shadow: 0 2px 8px rgba(0,0,0,0.15);
    z-index: 10000;
    transition: all 0.3s ease;
  `;
  
  // 悬停效果
  floatingButton.addEventListener('mouseenter', () => {
    floatingButton.style.transform = 'scale(1.1)';
    floatingButton.style.boxShadow = '0 4px 12px rgba(0,0,0,0.2)';
  });
  
  floatingButton.addEventListener('mouseleave', () => {
    floatingButton.style.transform = 'scale(1)';
    floatingButton.style.boxShadow = '0 2px 8px rgba(0,0,0,0.15)';
  });
}

// 隐藏浮动按钮
function hideFloatingButton() {
  if (floatingButton) {
    floatingButton.remove();
    floatingButton = null;
  }
}

// 收集选中文本
async function collectSelectedText() {
  if (!selectedText || selectedText.length < 10) {
    alert('请选择至少10个字符的文本');
    return;
  }
  
  console.log('准备收藏文本:', selectedText);
  
  try {
    // 获取当前页面信息
    const pageInfo = {
      url: window.location.href,
      title: document.title,
      selectedText: selectedText
    };
    
    // 发送到后台脚本
    const response = await chrome.runtime.sendMessage({
      action: 'collect',
      text: selectedText,
      url: window.location.href,
      title: document.title
    });
    
    if (response && response.success) {
      showSuccessMessage('文本收藏成功！');
      hideFloatingButton();
    } else {
      showErrorMessage('收藏失败: ' + (response?.error || '未知错误'));
    }
  } catch (error) {
    console.error('收藏文本失败:', error);
    showErrorMessage('收藏失败: ' + error.message);
  }
}

// 显示成功消息
function showSuccessMessage(message) {
  const notification = document.createElement('div');
  notification.innerHTML = `
    <div style="
      position: fixed;
      top: 20px;
      right: 20px;
      background: #52c41a;
      color: white;
      padding: 12px 20px;
      border-radius: 6px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.15);
      z-index: 10001;
      font-size: 14px;
      animation: slideIn 0.3s ease;
    ">
      ✅ ${message}
    </div>
  `;
  
  document.body.appendChild(notification);
  
  // 3秒后自动移除
  setTimeout(() => {
    notification.remove();
  }, 3000);
}

// 显示错误消息
function showErrorMessage(message) {
  const notification = document.createElement('div');
  notification.innerHTML = `
    <div style="
      position: fixed;
      top: 20px;
      right: 20px;
      background: #ff4d4f;
      color: white;
      padding: 12px 20px;
      border-radius: 6px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.15);
      z-index: 10001;
      font-size: 14px;
      animation: slideIn 0.3s ease;
    ">
      ❌ ${message}
    </div>
  `;
  
  document.body.appendChild(notification);
  
  // 5秒后自动移除
  setTimeout(() => {
    notification.remove();
  }, 5000);
}

// 添加CSS动画
const style = document.createElement('style');
style.textContent = `
  @keyframes slideIn {
    from {
      transform: translateX(100%);
      opacity: 0;
    }
    to {
      transform: translateX(0);
      opacity: 1;
    }
  }
`;
document.head.appendChild(style);

// 点击其他地方隐藏按钮
document.addEventListener('click', (e) => {
  if (floatingButton && !floatingButton.contains(e.target)) {
    hideFloatingButton();
  }
});

// 页面卸载时清理
window.addEventListener('beforeunload', () => {
  hideFloatingButton();
});

console.log('AI书签收藏助手内容脚本已加载');
console.log('Railway API地址:', 'https://ai-bookmark-production-5ecc.up.railway.app');