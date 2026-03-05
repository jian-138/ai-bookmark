// popup_module.js - 将登录优化器代码直接集成到popup.js�?
/**
 * 登录请求优化�? * 提供智能重试、超时处理和错误恢复
 */
class LoginOptimizer {
  constructor() {
    this.maxRetries = 3;
    this.baseTimeout = 15000; // 基础超时 15�?    this.retryDelays = [1000, 2000, 3000]; // 重试等待时间
  }

  /**
   * 优化的登录请�?   */
  async optimizedLogin(username, password) {
    console.log(`[LoginOptimizer] 开始登录优化流程，用户: ${username}`);
    
    for (let attempt = 1; attempt <= this.maxRetries; attempt++) {
      try {
        console.log(`[LoginOptimizer] 登录尝试 ${attempt}/${this.maxRetries}`);
        
        const result = await this.attemptLogin(username, password, attempt);
        
        if (result.success) {
          console.log(`[LoginOptimizer] 登录成功！`);
          return result;
        } else {
          // 如果是认证错误，不重�?          if (result.error?.includes('用户�?) || result.error?.includes('密码')) {
            console.log(`[LoginOptimizer] 认证失败，停止重试`);
            return result;
          }
          
          // 其他错误继续重试
          console.log(`[LoginOptimizer] 登录失败，准备重�? ${result.error}`);
          if (attempt < this.maxRetries) {
            await this.delay(this.retryDelays[attempt - 1]);
          }
        }
      } catch (error) {
        console.error(`[LoginOptimizer] �?{attempt}次尝试异�?`, error);
        
        // 最后一次尝试，返回错误
        if (attempt >= this.maxRetries) {
          return {
            success: false,
            error: this.getFriendlyErrorMessage(error)
          };
        }
        
        // 等待后重�?        await this.delay(this.retryDelays[attempt - 1]);
      }
    }
    
    return {
      success: false,
      error: '登录失败，请检查网络连�?
    };
  }

  /**
   * 单次登录尝试
   */
  async attemptLogin(username, password, attempt) {
    const timeout = this.baseTimeout + (attempt - 1) * 5000; // 递增超时
    
    return new Promise((resolve, reject) => {
      const timeoutId = setTimeout(() => {
        console.log(`[LoginOptimizer] �?{attempt}次尝试超�?(${timeout}ms)`);
        reject(new Error(`登录请求超时 (${timeout/1000}�?`));
      }, timeout);

      chrome.runtime.sendMessage({
        action: 'login',
        username,
        password
      }, (response) => {
        clearTimeout(timeoutId);
        
        if (chrome.runtime.lastError) {
          reject(new Error(`扩展通信错误: ${chrome.runtime.lastError.message}`));
          return;
        }
        
        resolve(response || { success: false, error: '未收到响�? });
      });
    });
  }

  /**
   * 友好的错误信�?   */
  getFriendlyErrorMessage(error) {
    const message = error.message || error.toString();
    
    if (message.includes('timeout')) {
      return '登录超时，请检查网络连接后重试';
    } else if (message.includes('Failed to fetch') || message.includes('网络')) {
      return '网络连接失败，请确保后端服务正在运行';
    } else if (message.includes('扩展通信')) {
      return '扩展通信错误，请重新加载扩展';
    } else if (message.includes('HTTP 5')) {
      return '服务器错误，请稍后重�?;
    } else if (message.includes('用户�?) || message.includes('密码')) {
      return message; // 保持原始认证错误信息
    } else {
      return '登录失败，请稍后重试';
    }
  }

  /**
   * 延迟函数
   */
  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

/**
 * 登录状态管理器
 */
class LoginStateManager {
  constructor() {
    this.isLoggingIn = false;
    this.currentUser = null;
    this.loginCallbacks = [];
  }

  /**
   * 执行登录
   */
  async performLogin(username, password) {
    if (this.isLoggingIn) {
      console.log('[LoginStateManager] 登录已在进行中，跳过重复请求');
      return { success: false, error: '登录正在进行�? };
    }

    this.isLoggingIn = true;
    
    try {
      const optimizer = new LoginOptimizer();
      const result = await optimizer.optimizedLogin(username, password);
      
      if (result.success) {
        this.currentUser = { username, userId: result.data?.user_id };
        await this.notifyCallbacks('success', result);
      } else {
        await this.notifyCallbacks('error', result);
      }
      
      return result;
    } catch (error) {
      console.error('[LoginStateManager] 登录异常:', error);
      const errorResult = {
        success: false,
        error: '登录过程中发生错�?
      };
      await this.notifyCallbacks('error', errorResult);
      return errorResult;
    } finally {
      this.isLoggingIn = false;
    }
  }

  /**
   * 添加登录回调
   */
  addCallback(callback) {
    this.loginCallbacks.push(callback);
  }

  /**
   * 通知回调
   */
  async notifyCallbacks(status, result) {
    for (const callback of this.loginCallbacks) {
      try {
        await callback(status, result);
      } catch (error) {
        console.error('[LoginStateManager] 回调执行失败:', error);
      }
    }
  }

  /**
   * 获取当前状�?   */
  getStatus() {
    return {
      isLoggingIn: this.isLoggingIn,
      currentUser: this.currentUser
    };
  }

  /**
   * 重置状�?   */
  reset() {
    this.isLoggingIn = false;
    this.currentUser = null;
    this.loginCallbacks = [];
  }
}
