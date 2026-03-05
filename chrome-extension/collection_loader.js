// collection_loader.js - 简化的收藏列表加载优化

/**
 * 智能收藏列表加载�? * 提供重试、缓存和错误处理功能
 */
class CollectionLoader {
  constructor() {
    this.retryCount = 0;
    this.maxRetries = 3;
    this.baseTimeout = 15000; // 基础超时 15�?    this.isLoading = false;
  }

  /**
   * 加载收藏列表（带智能重试�?   */
  async loadCollectionsWithRetry(options = {}) {
    const {
      page = 1,
      size = 20,
      onSuccess = null,
      onError = null,
      onRetry = null
    } = options;

    if (this.isLoading) {
      console.log('[CollectionLoader] 正在加载中，跳过重复请求');
      return { success: false, reason: 'loading_in_progress' };
    }

    this.isLoading = true;
    this.retryCount = 0;

    while (this.retryCount < this.maxRetries) {
      try {
        console.log(`[CollectionLoader] 尝试加载 (${this.retryCount + 1}/${this.maxRetries})`);
        
        const result = await this.fetchCollections(page, size);
        
        if (onSuccess) {
          onSuccess(result);
        }
        
        this.isLoading = false;
        return { success: true, data: result };
        
      } catch (error) {
        this.retryCount++;
        console.error(`[CollectionLoader] �?{this.retryCount}次尝试失�?`, error.message);
        
        if (onRetry) {
          onRetry(this.retryCount, error);
        }
        
        // 最后一次尝试失�?        if (this.retryCount >= this.maxRetries) {
          this.isLoading = false;
          
          const finalError = new Error(`加载失败 (${this.retryCount}次尝�?: ${error.message}`);
          
          if (onError) {
            onError(finalError);
          }
          
          return { success: false, error: finalError };
        }
        
        // 等待一段时间后重试（指数退避）
        const waitTime = Math.min(1000 * this.retryCount, 5000); // 最多等�?�?        console.log(`[CollectionLoader] 等待 ${waitTime}ms 后重�?..`);
        await this.sleep(waitTime);
      }
    }
  }

  /**
   * 获取收藏列表（单次尝试）
   */
  async fetchCollections(page, size) {
    return new Promise((resolve, reject) => {
      // 动态超时：第一�?5秒，后续每次增加5�?      const timeoutMs = this.baseTimeout + (this.retryCount * 5000);
      
      const timeout = setTimeout(() => {
        reject(new Error(`请求超时 (${timeoutMs/1000}�?`));
      }, timeoutMs);

      // 获取用户ID
      chrome.storage.local.get(['userId'], (storage) => {
        const userId = storage.userId;
        
        if (!userId) {
          clearTimeout(timeout);
          reject(new Error('用户未登�?));
          return;
        }

        console.log(`[CollectionLoader] 发送请求，用户ID: ${userId}`);

        chrome.runtime.sendMessage({
          action: 'getCollections',
          page: page,
          size: size,
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

          if (response.success) {
            resolve(response);
          } else {
            reject(new Error(response.error || '加载失败'));
          }
        });
      });
    });
  }

  /**
   * 延迟函数
   */
  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * 重置状�?   */
  reset() {
    this.retryCount = 0;
    this.isLoading = false;
  }

  /**
   * 获取当前状�?   */
  getStatus() {
    return {
      isLoading: this.isLoading,
      retryCount: this.retryCount,
      maxRetries: this.maxRetries
    };
  }
}

// 创建全局实例
window.collectionLoader = new CollectionLoader();

// 导出使用
export { CollectionLoader };
