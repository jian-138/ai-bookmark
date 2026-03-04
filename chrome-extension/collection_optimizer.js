// collection_optimizer.js - 收藏列表加载优化器

class CollectionOptimizer {
  constructor() {
    this.cache = new Map();
    this.isLoading = false;
    this.currentPage = 1;
    this.pageSize = 20;
    this.hasMore = true;
    this.lastFetchTime = 0;
    this.cacheExpiry = 5 * 60 * 1000; // 5分钟缓存
  }

  /**
   * 智能加载收藏列表
   */
  async loadCollections(options = {}) {
    const {
      forceRefresh = false,
      page = 1,
      size = this.pageSize,
      showLoading = true
    } = options;

    // 防止重复加载
    if (this.isLoading && !forceRefresh) {
      console.log('[CollectionOptimizer] 正在加载中，跳过重复请求');
      return { success: true, cached: true };
    }

    // 检查缓存
    const cacheKey = `collections_${page}_${size}`;
    const cachedData = this.cache.get(cacheKey);
    const now = Date.now();
    
    if (!forceRefresh && cachedData && (now - cachedData.timestamp) < this.cacheExpiry) {
      console.log('[CollectionOptimizer] 使用缓存数据');
      return {
        success: true,
        data: cachedData.data,
        cached: true,
        timestamp: cachedData.timestamp
      };
    }

    this.isLoading = true;

    try {
      if (showLoading) {
        this.showLoadingUI();
      }

      const result = await this.fetchCollections(page, size);
      
      // 缓存结果
      this.cache.set(cacheKey, {
        data: result,
        timestamp: now
      });

      this.lastFetchTime = now;
      this.hasMore = result.items.length === size;
      this.currentPage = page;

      return {
        success: true,
        data: result,
        cached: false
      };

    } catch (error) {
      console.error('[CollectionOptimizer] 加载失败:', error);
      
      // 如果失败但有缓存，返回缓存数据
      if (cachedData) {
        console.log('[CollectionOptimizer] 加载失败，使用缓存数据');
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
   * 获取收藏列表（带重试和超时）
   */
  async fetchCollections(page, size) {
    const storage = await chrome.storage.local.get(['userId', 'token']);
    
    if (!storage.userId || !storage.token) {
      throw new Error('用户未登录');
    }

    return new Promise((resolve, reject) => {
      let attempt = 0;
      const maxAttempts = 3;

      const tryFetch = () => {
        attempt++;
        console.log(`[CollectionOptimizer] 尝试获取收藏列表 (${attempt}/${maxAttempts})`);

        const timeout = setTimeout(() => {
          if (attempt < maxAttempts) {
            console.log(`[CollectionOptimizer] 第${attempt}次尝试超时，重试中...`);
            tryFetch();
          } else {
            reject(new Error('加载收藏列表超时，请检查网络连接'));
          }
        }, 15000 * attempt); // 递增超时时间

        chrome.runtime.sendMessage({
          action: 'getCollections',
          page: page,
          size: size,
          userId: storage.userId
        }, (response) => {
          clearTimeout(timeout);

          if (chrome.runtime.lastError) {
            const error = new Error('扩展通信错误：' + chrome.runtime.lastError.message);
            if (attempt < maxAttempts) {
              console.log(`[CollectionOptimizer] 通信错误，重试中...`);
              setTimeout(tryFetch, 1000 * attempt);
            } else {
              reject(error);
            }
            return;
          }

          if (!response) {
            const error = new Error('未收到服务器响应');
            if (attempt < maxAttempts) {
              console.log(`[CollectionOptimizer] 无响应，重试中...`);
              setTimeout(tryFetch, 1000 * attempt);
            } else {
              reject(error);
            }
            return;
          }

          if (response.success) {
            resolve(response);
          } else {
            reject(new Error(response.error || '加载失败'));
          }
        });
      };

      tryFetch();
    });
  }

  /**
   * 显示加载状态
   */
  showLoadingUI() {
    const listEl = document.getElementById('collections-list');
    if (listEl) {
      listEl.innerHTML = '<div class="loading">加载中...</div>';
    }
  }

  /**
   * 隐藏加载状态
   */
  hideLoadingUI() {
    const loadingEl = document.querySelector('.loading');
    if (loadingEl) {
      loadingEl.remove();
    }
  }

  /**
   * 清除缓存
   */
  clearCache() {
    this.cache.clear();
    console.log('[CollectionOptimizer] 缓存已清除');
  }

  /**
   * 获取缓存统计
   */
  getCacheStats() {
    return {
      cacheSize: this.cache.size,
      lastFetchTime: this.lastFetchTime,
      hasMore: this.hasMore,
      currentPage: this.currentPage
    };
  }
}

// 创建全局实例
window.collectionOptimizer = new CollectionOptimizer();

// 导出使用
export { CollectionOptimizer };