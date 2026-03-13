// 测试登录功能的脚本
async function testLogin() {
  console.log('=== 开始测试登录功能 ===');
  
  // 测试后端连接
  try {
    console.log('测试后端服务连接...');
    const response = await fetch('http://localhost:8000/api/v1/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        username: 'test',
        password: 'test123'
      })
    });
    
    console.log('后端响应状态:', response.status);
    const data = await response.json();
    console.log('后端响应数据:', data);
    
    if (data.success) {
      console.log('✅ 后端登录测试成功');
    } else {
      console.log('❌ 后端登录测试失败:', data.message);
    }
  } catch (error) {
    console.error('❌ 后端连接失败:', error.message);
  }
  
  // 测试Chrome扩展的登录流程
  console.log('\n=== 测试Chrome扩展登录流程 ===');
  
  try {
    // 模拟popup.js中的登录流程
    const username = 'test';
    const password = 'test123';
    
    console.log('发送登录消息到background.js...');
    
    // 使用Promise包装消息发送
    const response = await new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error('登录请求超时'));
      }, 20000);
      
      chrome.runtime.sendMessage({
        action: 'login',
        username,
        password
      }, (response) => {
        clearTimeout(timeout);
        if (chrome.runtime.lastError) {
          console.error('Chrome runtime error:', chrome.runtime.lastError);
          reject(new Error(chrome.runtime.lastError.message));
        } else {
          resolve(response);
        }
      });
    });
    
    console.log('登录响应:', response);
    
    if (response && response.success) {
      console.log('✅ Chrome扩展登录成功');
      
      // 保存登录信息
      await chrome.storage.local.set({
        token: response.token,
        userId: response.user_id,
        isLoggedIn: true
      });
      console.log('✅ 登录信息已保存');
      
    } else {
      console.log('❌ Chrome扩展登录失败:', response?.error || response?.message || '未知错误');
    }
    
  } catch (error) {
    console.error('❌ Chrome扩展登录失败:', error.message);
  }
  
  console.log('\n=== 测试完成 ===');
}

// 检查Chrome存储中的登录状态
async function checkLoginStatus() {
  console.log('=== 检查登录状态 ===');
  const storage = await chrome.storage.local.get(['isLoggedIn', 'userId', 'token']);
  console.log('当前登录状态:', storage);
  return storage;
}

// 清除登录信息
async function clearLogin() {
  console.log('=== 清除登录信息 ===');
  await chrome.storage.local.remove(['isLoggedIn', 'userId', 'token']);
  console.log('✅ 登录信息已清除');
}

// 导出测试函数
window.testLogin = testLogin;
window.checkLoginStatus = checkLoginStatus;
window.clearLogin = clearLogin;

console.log('测试脚本已加载完成');
console.log('可用函数:');
console.log('- testLogin(): 测试完整的登录流程');
console.log('- checkLoginStatus(): 检查当前登录状态');
console.log('- clearLogin(): 清除登录信息');