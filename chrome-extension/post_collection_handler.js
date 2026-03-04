// post_collection_handler.js - 收藏后处理

/**
 * 收藏后自动刷新管理器
 * 处理收藏成功后的列表刷新逻辑
 */
class PostCollectionHandler {
  constructor() {
    this.refreshTimeout = null;
    this.maxRetries = 2;
    this.retryDelay = 1500; // 1.5秒
  }

  /**
   * 收藏成功后调用
   */
  async onCollectionSuccess(collectData) {
    console.log('[PostCollectionHandler] 收藏成功，准备刷新收藏列表', collectData);
    
    // 清除之前的刷新定时器
    if (this.refreshTimeout) {
      clearTimeout(this.refreshTimeout);
    }
    
    // 延迟刷新，避免立即请求导致的超时
    this.refreshTimeout = setTimeout(async () => {
      await this.refreshCollectionsWithRetry();
    }, this.retryDelay);
  }

  /**
   * 带重试的收藏列表刷新
   */
  async refreshCollectionsWithRetry() {
    console.log('[PostCollectionHandler] 开始刷新收藏列表');
    
    for (let attempt = 1; attempt <= this.maxRetries; attempt++) {
      try {
        console.log(`[PostCollectionHandler] 刷新尝试 ${attempt}/${this.maxRetries}`);
        
        // 检查是否可以使用增强版加载器
        if (window.enhancedCollectionLoader) {
          const result = await window.enhancedCollectionLoader.loadCollections({
            page: 1,
            size: 20,
            forceRefresh: true,
            showLoading: false, // 不显示加载动画
            useCache: false     // 不使用缓存
          });
          
          if (result.success) {
            console.log('[PostCollectionHandler] 收藏列表刷新成功');
            this.showSuccessNotification();
            return;
          }
        }
        
        // 回退到原始方法
        if (window.loadCollections) {
          await window.loadCollections();
          console.log('[PostCollectionHandler] 使用原始方法刷新成功');
          return;
        }
        
        throw new Error('没有可用的刷新方法');
        
      } catch (error) {
        console.error(`[PostCollectionHandler] 第${attempt}次刷新失败:`, error.message);
        
        if (attempt >= this.maxRetries) {
          this.showErrorNotification(error.message);
          return;
        }
        
        // 等待后重试
        await this.delay(1000 * attempt);
      }
    }
  }

  /**
   * 显示成功通知
   */
  showSuccessNotification() {
    // 创建临时通知元素
    const notification = document.createElement('div');
    notification.className = 'collection-refresh-success';
    notification.innerHTML = `
      <div style="
        position: fixed;
        top: 20px;
        right: 20px;
        background: #4caf50;
        color: white;
        padding: 12px 16px;
        border-radius: 4px;
        box-shadow: 0 2px 8px rgba(0,0,0,0.2);
        z-index: 10000;
        font-size: 14px;
        animation: slideInRight 0.3s ease;
      ">
        ✅ 收藏列表已更新
      </div>
    `;
    
    document.body.appendChild(notification);
    
    // 3秒后移除
    setTimeout(() => {
      if (notification.parentNode) {
        notification.parentNode.removeChild(notification);
      }
    }, 3000);
  }

  /**
   * 显示错误通知
   */
  showErrorNotification(errorMessage) {
    console.warn('[PostCollectionHandler] 收藏列表刷新失败:', errorMessage);
    
    // 创建错误通知元素
    const notification = document.createElement('div');
    notification.className = 'collection-refresh-error';
    notification.innerHTML = `
      <div style="
        position: fixed;
        top: 20px;
        right: 20px;
        background: #ff9800;
        color: white;
        padding: 12px 16px;
        border-radius: 4px;
        box-shadow: 0 2px 8px rgba(0,0,0,0.2);
        z-index: 10000;
        font-size: 14px;
        animation: slideInRight 0.3s ease;
      ">
        ⚠️ 收藏成功，但列表更新失败
        <br>
        <small>${errorMessage}</small>
      </div>
    `;
    
    document.body.appendChild(notification);
    
    // 5秒后移除
    setTimeout(() => {
      if (notification.parentNode) {
        notification.parentNode.removeChild(notification);
      }
    }, 5000);
  }

  /**
   * 延迟函数
   */
  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * 清理资源
   */
  cleanup() {
    if (this.refreshTimeout) {
      clearTimeout(this.refreshTimeout);
      this.refreshTimeout = null;
    }
  }
}

/**
 * 消息监听器 - 监听收藏成功事件
 */
function setupCollectionSuccessListener() {
  console.log('[PostCollectionHandler] 设置收藏成功监听器');
  
  // 监听来自内容脚本的消息
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === 'collectionSuccess') {
      console.log('[PostCollectionHandler] 收到收藏成功消息', message.data);
      
      // 异步处理，不阻塞消息响应
      setTimeout(async () => {
        const handler = new PostCollectionHandler();
        await handler.onCollectionSuccess(message.data);
      }, 100);
      
      return false; // 异步响应
    }
  });
  
  // 监听来自popup的消息
  window.addEventListener('message', (event) => {
    if (event.data && event.data.type === 'collectionSuccess') {
      console.log('[PostCollectionHandler] 收到窗口收藏成功消息', event.data);
      
      setTimeout(async () => {
        const handler = new PostCollectionHandler();
        await handler.onCollectionSuccess(event.data.data);
      }, 100);
    }
  });
}

// 创建全局实例
window.postCollectionHandler = new PostCollectionHandler();

// 设置监听器
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', setupCollectionSuccessListener);
} else {
  setupCollectionSuccessListener();
}

console.log('[PostCollectionHandler] 收藏后处理模块已加载');