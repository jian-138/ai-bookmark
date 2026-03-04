// collection_loader_enhanced.js - 增强版收藏列表加载器

/**
 * 增强版收藏列表加载器
 * 专门处理收藏后的加载超时问题
 */
class EnhancedCollectionLoader {
  constructor() {
    this.isLoading = false;
    this.retryCount = 0;
    this.maxRetries = 3;
    this.baseTimeout = 20000; // 基础超时20秒
    this.retryDelays = [2000, 4000, 6000]; // 递增重试延迟
    this.cache = new Map();
    this.cacheExpiry = 5 * 60 * 1000; // 5分钟缓存
  }

  /**
   * 加载收藏列表（增强版）
   */
  async loadCollections(options = {}) {
    const {
      page = 1,
      size = 20,
      forceRefresh = false,
      showLoading = true,
      useCache = true
    } = options;

    // 防止重复加载
    if (this.isLoading && !forceRefresh) {
      console.log('[EnhancedCollectionLoader] 正在加载中，跳过重复请求');
      return { success: true, cached: true, reason: 'loading_in_progress' };
    }

    // 检查缓存
    const cacheKey = `collections_${page}_${size}`;
    const cachedData = this.cache.get(cacheKey);
    const now = Date.now();
    
    if (!forceRefresh && useCache && cachedData && (now - cachedData.timestamp) < this.cacheExpiry) {
      console.log('[EnhancedCollectionLoader] 使用缓存数据');
      return {
        success: true,
        data: cachedData.data,
        cached: true,
        timestamp: cachedData.timestamp
      };
    }

    this.isLoading = true;
    this.retryCount = 0;

    try {
      if (showLoading) {
        this.showLoadingUI();
      }

      // 尝试加载数据
      const result = await this.loadWithRetry(page, size);
      
      // 缓存结果
      this.cache.set(cacheKey, {
        data: result,
        timestamp: now
      });

      return {
        success: true,
        data: result,
        cached: false
      };

    } catch (error) {
      console.error('[EnhancedCollectionLoader] 加载失败:', error);
      
      // 如果失败但有缓存，返回缓存数据
      if (cachedData) {
        console.log('[EnhancedCollectionLoader] 加载失败，使用缓存数据');
        return {
          success: true,
          data: cachedData.data,
          cached: true,
          fallback: true,
          error: error.message
        };
      }

      throw error;
    } finally {
      this.isLoading = false;
      if (showLoading) {
        this.hideLoadingUI();
      }
    }
  }

  /**
   * 带重试的加载
   */
  async loadWithRetry(page, size) {
    for (let attempt = 1; attempt <= this.maxRetries; attempt++) {
      try {
        console.log(`[EnhancedCollectionLoader] 加载尝试 ${attempt}/${this.maxRetries}`);
        
        const result = await this.fetchCollections(page, size, attempt);
        return result;
        
      } catch (error) {
        this.retryCount = attempt;
        console.error(`[EnhancedCollectionLoader] 第${attempt}次尝试失败:`, error.message);
        
        if (attempt >= this.maxRetries) {
          throw new Error(`加载失败 (${attempt}次尝试): ${error.message}`);
        }
        
        // 等待后重试
        const waitTime = this.retryDelays[attempt - 1];
        console.log(`[EnhancedCollectionLoader] 等待 ${waitTime}ms 后重试...`);
        await this.delay(waitTime);
      }
    }
  }

  /**
   * 获取收藏列表（单次尝试）
   */
  async fetchCollections(page, size, attempt) {
    const timeout = this.baseTimeout + (attempt - 1) * 10000; // 递增超时
    
    return new Promise((resolve, reject) => {
      const timeoutId = setTimeout(() => {
        reject(new Error(`请求超时 (${timeout/1000}秒) - 服务响应缓慢`));
      }, timeout);

      chrome.storage.local.get(['userId'], (storage) => {
        const userId = storage.userId;
        
        if (!userId) {
          clearTimeout(timeoutId);
          reject(new Error('用户未登录'));
          return;
        }

        console.log(`[EnhancedCollectionLoader] 获取收藏列表，用户ID: ${userId}, 第${attempt}次尝试`);

        chrome.runtime.sendMessage({
          action: 'getCollections',
          page: page,
          size: size,
          userId: userId
        }, (response) => {
          clearTimeout(timeoutId);

          if (chrome.runtime.lastError) {
            reject(new Error(`扩展通信错误: ${chrome.runtime.lastError.message}`));
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

  /**
   * 智能收藏后刷新
   * 在收藏成功后调用，优化加载策略
   */
  async refreshAfterCollection() {
    console.log('[EnhancedCollectionLoader] 收藏后刷新收藏列表');
    
    // 立即显示新收藏（乐观更新）
    this.showOptimisticUpdate();
    
    // 延迟后台刷新（避免立即加载导致的超时）
    setTimeout(async () => {
      try {
        console.log('[EnhancedCollectionLoader] 后台刷新收藏列表');
        await this.loadCollections({
          page: 1,
          size: 20,
          forceRefresh: true,
          showLoading: false, // 不显示加载状态
          useCache: false // 不使用缓存
        });
        
        console.log('[EnhancedCollectionLoader] 后台刷新完成');
        
      } catch (error) {
        console.error('[EnhancedCollectionLoader] 后台刷新失败:', error);
        // 后台刷新失败不影响用户体验
      }
    }, 2000); // 延迟2秒后刷新
  }

  /**
   * 乐观更新显示
   */
  showOptimisticUpdate() {
    // 显示友好的提示信息
    const listEl = document.getElementById('collections-list');
    if (listEl) {
      const optimisticMsg = document.createElement('div');
      optimisticMsg.className = 'optimistic-update';
      optimisticMsg.innerHTML = `
        <div style="padding: 10px; background: #e8f5e8; border-left: 4px solid #4caf50; margin: 5px 0; border-radius: 4px;">
          <span>📝 新收藏已添加，正在后台加载...</span>
        </div>
      `;
      
      // 插入到列表顶部
      if (listEl.firstChild) {
        listEl.insertBefore(optimisticMsg, listEl.firstChild);
      } else {
        listEl.appendChild(optimisticMsg);
      }
      
      // 3秒后自动移除提示
      setTimeout(() => {
        if (optimisticMsg.parentNode) {
          optimisticMsg.parentNode.removeChild(optimisticMsg);
        }
      }, 3000);
    }
  }

  /**
   * 显示加载UI
   */
  showLoadingUI() {
    const listEl = document.getElementById('collections-list');
    if (listEl) {
      listEl.innerHTML = '<div class="loading">正在加载收藏列表...</div>';
    }
  }

  /**
   * 隐藏加载UI
   */
  hideLoadingUI() {
    // 由renderCollections函数处理
  }

  /**
   * 延迟函数
   */
  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * 清除缓存
   */
  clearCache() {
    this.cache.clear();
    console.log('[EnhancedCollectionLoader] 缓存已清除');
  }

  /**
   * 获取状态
   */
  getStatus() {
    return {
      isLoading: this.isLoading,
      retryCount: this.retryCount,
      maxRetries: this.maxRetries,
      cacheSize: this.cache.size
    };
  }
}

/**
 * 收藏后加载管理器
 * 专门处理收藏成功后的列表刷新
 */
class PostCollectionManager {
  constructor() {
    this.isProcessing = false;
    this.pendingRefresh = false;
  }

  /**
   * 收藏成功后调用
   */
  async onCollectionSuccess() {
    if (this.isProcessing) {
      this.pendingRefresh = true;
      return;
    }

    this.isProcessing = true;
    
    try {
      console.log('[PostCollectionManager] 处理收藏成功后的刷新');
      
      // 使用增强版加载器
      const loader = new EnhancedCollectionLoader();
      await loader.refreshAfterCollection();
      
    } catch (error) {
      console.error('[PostCollectionManager] 刷新失败:', error);
      
      // 显示友好的错误提示
      this.showRefreshError(error.message);
      
    } finally {
      this.isProcessing = false;
      
      // 处理待刷新的请求
      if (this.pendingRefresh) {
        this.pendingRefresh = false;
        setTimeout(() => this.onCollectionSuccess(), 1000);
      }
    }
  }

  /**
   * 显示刷新错误
   */
  showRefreshError(errorMessage) {
    const listEl = document.getElementById('collections-list');
    if (listEl) {
      const errorMsg = document.createElement('div');
      errorMsg.className = 'refresh-error';
      errorMsg.innerHTML = `
        <div style="padding: 10px; background: #fff3cd; border-left: 4px solid #ffc107; margin: 5px 0; border-radius: 4px;">
          <span>⚠️ 收藏成功，但列表刷新失败: ${errorMessage}</span>
          <button onclick="window.location.reload()" style="margin-left: 10px; padding: 2px 8px; font-size: 12px;">刷新页面</button>
        </div>
      `;
      
      if (listEl.firstChild) {
        listEl.insertBefore(errorMsg, listEl.firstChild);
      } else {
        listEl.appendChild(errorMsg);
      }
    }
  }
}

// 创建全局实例
window.enhancedCollectionLoader = new EnhancedCollectionLoader();
window.postCollectionManager = new PostCollectionManager();

console.log('✅ 增强版收藏列表加载器已初始化');