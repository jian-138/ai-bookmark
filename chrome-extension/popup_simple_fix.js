// popup_simple_fix.js - 简化版登录修复（兼容现有代码）

/**
 * 简化版登录修复 - 解决点击登录无响应问�? * 兼容现有代码结构，不使用ES6模块导入
 */

// 确保全局变量存在
window.LoginStateManager = window.LoginStateManager || {};

/**
 * 简化的登录处理函数 - 直接替换原有的handleLogin
 */
async function handleLoginSimple() {
  console.log('=== 简化版登录处理开�?===');
  
  const username = document.getElementById('username').value.trim();
  const password = document.getElementById('password').value.trim();
  const errorEl = document.getElementById('login-error');
  const loginBtn = document.getElementById('login-btn');
  
  if (!username || !password) {
    errorEl.textContent = '请输入用户名和密�?;
    errorEl.style.display = 'block';
    return;
  }
  
  // 按钮状�?  loginBtn.textContent = '登录�?..';
  loginBtn.disabled = true;
  errorEl.style.display = 'none';
  errorEl.textContent = '';
  
  try {
    console.log('用户�?', username);
    
    // 使用Promise包装消息发送，添加超时处理
    const response = await new Promise((resolve, reject) => {
      // 延长超时时间�?5秒（应对服务响应缓慢�?      const timeout = setTimeout(() => {
        reject(new Error('登录请求超时，请检查后端服务是否正在运�?));
      }, 45000);
      
      console.log('发送登录请求到background.js...');
      
      chrome.runtime.sendMessage({
        action: 'login',
        username: username,
        password: password
      }, (response) => {
        clearTimeout(timeout);
        
        if (chrome.runtime.lastError) {
          console.error('Chrome runtime error:', chrome.runtime.lastError);
          reject(new Error('扩展通信错误�? + chrome.runtime.lastError.message));
        } else {
          console.log('收到登录响应:', response);
          resolve(response);
        }
      });
    });
    
    console.log('登录响应结果:', response);
    
    // 检查响�?    if (!response) {
      throw new Error('未收到服务器响应');
    }
    
    if (response.success) {
      console.log('登录成功，准备显示主页面');
      
      // 保存用户信息（简化版�?      await chrome.storage.local.set({
        token: response.token,
        userId: response.user_id,
        isLoggedIn: true,
        username: username
      });
      
      // 显示主页�?      showMainPage();
      
      // 异步加载数据
      setTimeout(() => {
        loadCollections().catch(error => {
          console.error('加载收藏列表失败:', error);
        });
      }, 100);
      
    } else {
      console.error('登录失败:', response?.error || response?.message || '未知错误');
      const errorMsg = response?.error || response?.message || '登录失败，请检查用户名和密�?;
      errorEl.textContent = errorMsg;
      errorEl.style.display = 'block';
    }
    
  } catch (error) {
    console.error('=== 登录异常 ===');
    console.error('错误类型:', error.name);
    console.error('错误消息:', error.message);
    console.error('错误堆栈:', error.stack);
    
    // 友好的错误信�?    let errorMsg = error.message || '登录失败';
    
    if (error.message.includes('timeout')) {
      errorMsg = '登录超时，请检查网络连接或稍后重试';
    } else if (error.message.includes('Failed to fetch') || error.message.includes('网络')) {
      errorMsg = '网络连接失败，请确保后端服务正在运行';
    } else if (error.message.includes('扩展通信')) {
      errorMsg = '扩展通信错误，请重新加载扩展';
    }
    
    errorEl.textContent = errorMsg;
    errorEl.style.display = 'block';
    
  } finally {
    // 恢复按钮状�?    loginBtn.textContent = '登录';
    loginBtn.disabled = false;
    console.log('=== 登录处理完成 ===');
  }
}

/**
 * 修复登录功能 - 替换事件监听�? */
function fixLoginButton() {
  console.log('开始修复登录按�?..');
  
  // 等待DOM加载完成
  setTimeout(() => {
    const loginBtn = document.getElementById('login-btn');
    
    if (loginBtn) {
      console.log('找到登录按钮，开始修�?..');
      
      // 移除旧的事件监听器（如果有）
      const newLoginBtn = loginBtn.cloneNode(true);
      loginBtn.parentNode.replaceChild(newLoginBtn, loginBtn);
      
      // 添加新的事件监听�?      newLoginBtn.addEventListener('click', handleLoginSimple);
      
      // 添加回车键支�?      const usernameInput = document.getElementById('username');
      const passwordInput = document.getElementById('password');
      
      if (usernameInput && passwordInput) {
        [usernameInput, passwordInput].forEach(input => {
          input.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
              handleLoginSimple();
            }
          });
        });
      }
      
      console.log('登录按钮修复完成�?);
      
    } else {
      console.error('未找到登录按钮，修复失败�?);
    }
  }, 500); // 延迟500ms确保DOM完全加载
}

/**
 * 验证修复是否成功
 */
function verifyLoginFix() {
  console.log('验证登录修复状�?..');
  
  const loginBtn = document.getElementById('login-btn');
  const usernameInput = document.getElementById('username');
  const passwordInput = document.getElementById('password');
  
  console.log('登录按钮:', loginBtn ? '存在' : '不存�?);
  console.log('用户名输入框:', usernameInput ? '存在' : '不存�?);
  console.log('密码输入�?', passwordInput ? '存在' : '不存�?);
  
  if (loginBtn && usernameInput && passwordInput) {
    console.log('�?所有必要的DOM元素都存�?);
    
    // 检查默认�?    console.log('用户名默认�?', usernameInput.value);
    console.log('密码默认�?', passwordInput.value);
    
    return true;
  } else {
    console.error('�?缺少必要的DOM元素');
    return false;
  }
}

/**
 * 测试登录功能
 */
async function testLoginFunction() {
  console.log('开始测试登录功�?..');
  
  const username = document.getElementById('username').value;
  const password = document.getElementById('password').value;
  
  console.log('测试账号:', username);
  console.log('测试密码:', password.length > 0 ? '已填�? : '未填�?);
  
  try {
    // 测试Chrome运行时API
    console.log('测试Chrome运行时API...');
    
    chrome.runtime.sendMessage({
      action: 'ping'
    }, (response) => {
      if (chrome.runtime.lastError) {
        console.error('Chrome运行时API错误:', chrome.runtime.lastError);
      } else {
        console.log('Chrome运行时API正常，响�?', response);
      }
    });
    
    // 测试存储API
    console.log('测试存储API...');
    await chrome.storage.local.set({test: 'test'});
    const result = await chrome.storage.local.get('test');
    console.log('存储API正常，测试结�?', result);
    
    console.log('�?基础功能测试通过');
    return true;
    
  } catch (error) {
    console.error('�?功能测试失败:', error);
    return false;
  }
}

// 当DOM加载完成后自动执行修�?document.addEventListener('DOMContentLoaded', function() {
  console.log('DOM加载完成，开始自动修�?..');
  
  // 延迟执行以确保所有脚本加载完�?  setTimeout(() => {
    fixLoginButton();
    
    // 验证修复
    setTimeout(() => {
      verifyLoginFix();
      testLoginFunction();
    }, 1000);
    
  }, 1000);
});

// 导出修复函数供手动调�?window.fixLoginFunctions = {
  fixLoginButton,
  verifyLoginFix,
  testLoginFunction,
  handleLoginSimple
};

console.log('登录修复脚本已加载完成！');
