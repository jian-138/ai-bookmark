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
  
  // 3秒后自动隐藏
  setTimeout(() => {
    if (floatingButton) {
      floatingButton.style.opacity = '0';
      setTimeout(hideFloatingButton, 300);
    }
  }, 3000);
}

// 隐藏浮动按钮
function hideFloatingButton() {
  if (floatingButton) {
    floatingButton.remove();
    floatingButton = null;
  }
}

// 收藏选中的文本
function collectSelectedText() {
  if (!selectedText || selectedText.length < 10) {
    showToast('请选择至少10个字符的文本', 'error');
    return;
  }
  
  // 发送到background script
  chrome.runtime.sendMessage({
    action: 'collect',
    text: selectedText,
    url: window.location.href
  }, (response) => {
    if (response && response.success) {
      showToast('✅ 收藏成功！AI分析中...', 'success');
      hideFloatingButton();
      window.getSelection().removeAllRanges();
    } else {
      showToast('❌ 收藏失败: ' + (response?.error || '未知错误'), 'error');
    }
  });
}

// 显示Toast提示
function showToast(message, type = 'info') {
  const toast = document.createElement('div');
  toast.className = `ai-bookmark-toast ai-bookmark-toast-${type}`;
  toast.textContent = message;
  
  document.body.appendChild(toast);
  
  // 触发动画
  setTimeout(() => toast.classList.add('show'), 10);
  
  // 3秒后移除
  setTimeout(() => {
    toast.classList.remove('show');
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}

// 监听来自popup的消息
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'getSelectedText') {
    sendResponse({ text: selectedText });
  }
});

// 键盘快捷键 (Ctrl+Shift+S 收藏)
document.addEventListener('keydown', (e) => {
  if (e.ctrlKey && e.shiftKey && e.key === 'S') {
    e.preventDefault();
    if (selectedText) {
      collectSelectedText();
    } else {
      showToast('请先选择要收藏的文本', 'error');
    }
  }
});

console.log('AI书签收藏助手已加载');
