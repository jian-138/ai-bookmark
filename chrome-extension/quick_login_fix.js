// quick_login_fix.js - 登录超时快速修复

/**
 * 快速登录修复 - 针对服务响应缓慢问题
 */
class QuickLoginFix {
  constructor() {
    this.extendedTimeout = 60000; // 60秒超时（应对缓慢服务）
    this.maxRetries = 2; // 减少重试次数，避免过度等待
    this.retryDelay = 3000; // 3秒重试延迟
  }

  /**
   * 快速登录（优化版）
   */
  async quickLogin(username, password) {
    console.log(`[QuickLoginFix] 开始快速登录，用户: ${username}`);
    
    for (let attempt = 1; attempt <= this.maxRetries; attempt++) {
      try {
        console.log(`[QuickLoginFix] 尝试 ${attempt}/${this.maxRetries}`);
        
        const result = await this.singleLoginAttempt(username, password, attempt);
        
        if (result.success) {
          console.log(`[QuickLoginFix] 登录成功！`);
          return result;
        }
        
        // 认证失败不重试
        if (result.error && (result.error.includes('用户名') || result.error.includes('密码'))) {
          return result;
        }
        
        // 最后一次尝试失败
        if (attempt >= this.maxRetries) {
          return result;
        }
        
        // 等待后重试
        console.log(`[QuickLoginFix] 等待 ${this.retryDelay}ms 后重试...`);
        await this.delay(this.retryDelay);
        
      } catch (error) {
        console.error(`[QuickLoginFix] 第${attempt}次尝试异常:`, error.message);
        
        if (attempt >= this.maxRetries) {
          return {
            success: false,
            error: this.getErrorMessage(error)
          };
        }
      }
    }
  }

  /**
   * 单次登录尝试（简化版）
   */
  async singleLoginAttempt(username, password, attempt) {
    return new Promise((resolve, reject) => {
      const timeout = this.extendedTimeout;
      const timeoutId = setTimeout(() => {
        console.log(`[QuickLoginFix] 第${attempt}次尝试超时 (${timeout}ms)`);
        reject(new Error(`登录超时 (${timeout/1000}秒) - 服务响应过慢`));
      }, timeout);

      // 发送登录请求
      chrome.runtime.sendMessage({
        action: 'login',
        username,
        password
      }, (response) => {
        clearTimeout(timeoutId);
        
        if (chrome.runtime.lastError) {
          reject(new Error(`扩展错误: ${chrome.runtime.lastError.message}`));
          return;
        }
        
        // 处理响应
        if (!response) {
          resolve({ success: false, error: '未收到服务器响应' });
          return;
        }
        
        if (response.success) {
          resolve({ success: true, data: response });
        } else {
          resolve({ 
            success: false, 
            error: response.error || response.message || '登录失败' 
          });
        }
      });
    });
  }

  /**
   * 错误信息转换
   */
  getErrorMessage(error) {
    const message = error.message || error.toString();
    
    if (message.includes('timeout')) {
      return '登录超时 - 服务响应缓慢，请稍后重试';
    } else if (message.includes('Failed to fetch') || message.includes('网络')) {
      return '网络连接失败 - 请检查服务是否启动';
    } else if (message.includes('扩展')) {
      return '扩展通信错误 - 请重新加载扩展';
    } else {
      return '登录失败 - 请检查网络连接';
    }
  }

  /**
   * 延迟函数
   */
  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * 服务状态检查（快速）
   */
  async checkServiceStatus() {
    try {
      const response = await fetch('http://localhost:8000/health', {
        method: 'GET',
        signal: AbortSignal.timeout(5000) // 5秒超时
      });
      return response.ok;
    } catch (error) {
      console.log('[QuickLoginFix] 服务检查失败:', error.message);
      return false;
    }
  }
}

/**
 * 备用登录方案（降级处理）
 */
class FallbackLogin {
  constructor() {
    this.isAvailable = false;
  }

  /**
   * 检查是否可用
   */
  async checkAvailability() {
    // 检查本地存储是否有缓存的登录信息
    try {
      const result = await chrome.storage.local.get(['cachedUser', 'cachedToken']);
      this.isAvailable = !!(result.cachedUser && result.cachedToken);
      return this.isAvailable;
    } catch (error) {
      console.error('[FallbackLogin] 检查可用性失败:', error);
      return false;
    }
  }

  /**
   * 尝试离线登录
   */
  async tryOfflineLogin() {
    if (!this.isAvailable) {
      return { success: false, error: '无缓存登录信息' };
    }

    try {
      const result = await chrome.storage.local.get(['cachedUser', 'cachedToken']);
      
      // 简单的Token验证（检查格式）
      if (result.cachedToken && result.cachedToken.length > 10) {
        return {
          success: true,
          data: {
            token: result.cachedToken,
            user_id: result.cachedUser?.userId,
            offline: true
          }
        };
      } else {
        return { success: false, error: '缓存的登录信息无效' };
      }
    } catch (error) {
      return { success: false, error: '离线登录失败' };
    }
  }
}

// 创建全局实例
window.quickLoginFix = new QuickLoginFix();
window.fallbackLogin = new FallbackLogin();

// 导出使用
export { QuickLoginFix, FallbackLogin };