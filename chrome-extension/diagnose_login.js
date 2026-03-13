// 诊断Chrome扩展登录问题的脚本
async function diagnoseLoginIssue() {
  console.log('🔍 === Chrome扩展登录问题诊断 ===');
  
  // 1. 检查manifest.json中的权限
  console.log('\n📋 1. 检查扩展权限配置...');
  try {
    const manifestUrl = chrome.runtime.getURL('manifest.json');
    const response = await fetch(manifestUrl);
    const manifest = await response.json();
    
    console.log('主机权限:', manifest.host_permissions);
    
    const hasLocalhost = manifest.host_permissions.some(permission => 
      permission.includes('localhost:8000') || permission.includes('127.0.0.1:8000')
    );
    
    if (hasLocalhost) {
      console.log('✅ 本地主机权限已配置');
    } else {
      console.log('❌ 本地主机权限缺失');
    }
  } catch (error) {
    console.error('无法读取manifest.json:', error);
  }
  
  // 2. 检查background.js中的API配置
  console.log('\n🔧 2. 检查API配置...');
  try {
    // 获取background页面
    const backgroundPage = await chrome.runtime.getBackgroundPage();
    if (backgroundPage && backgroundPage.currentApiUrl) {
      console.log('当前API URL:', backgroundPage.currentApiUrl);
    } else {
      console.log('无法获取background页面或API配置');
    }
  } catch (error) {
    console.log('无法访问background页面，这是正常的');
  }
  
  // 3. 测试网络连接
  console.log('\n🌐 3. 测试网络连接...');
  const testUrls = [
    'http://localhost:8000/api/v1/auth/login',
    'http://127.0.0.1:8000/api/v1/auth/login'
  ];
  
  for (const url of testUrls) {
    try {
      console.log(`测试连接: ${url}`);
      const response = await fetch(url, {
        method: 'OPTIONS',
        timeout: 5000
      });
      console.log(`✅ ${url} - 状态: ${response.status}`);
    } catch (error) {
      console.log(`❌ ${url} - 错误: ${error.message}`);
    }
  }
  
  // 4. 检查Chrome存储
  console.log('\n💾 4. 检查Chrome存储状态...');
  try {
    const storage = await chrome.storage.local.get(['isLoggedIn', 'userId', 'token']);
    console.log('存储数据:', storage);
    
    if (storage.isLoggedIn) {
      console.log('✅ 用户已登录');
    } else {
      console.log('ℹ️ 用户未登录');
    }
  } catch (error) {
    console.error('无法访问存储:', error);
  }
  
  // 5. 测试消息传递
  console.log('\n📨 5. 测试消息传递...');
  try {
    console.log('发送测试消息到background...');
    
    const response = await new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error('消息传递超时'));
      }, 10000);
      
      chrome.runtime.sendMessage({
        action: 'login',
        username: 'test',
        password: 'test123'
      }, (response) => {
        clearTimeout(timeout);
        if (chrome.runtime.lastError) {
          reject(new Error(chrome.runtime.lastError.message));
        } else {
          resolve(response);
        }
      });
    });
    
    console.log('消息响应:', response);
    
    if (response && response.success) {
      console.log('✅ 消息传递成功，登录功能正常');
    } else {
      console.log('❌ 登录失败:', response?.error || response?.message || '未知错误');
    }
    
  } catch (error) {
    console.error('❌ 消息传递失败:', error.message);
  }
  
  console.log('\n🔍 === 诊断完成 ===');
  console.log('建议:');
  console.log('1. 如果网络连接测试失败，请检查后端服务是否运行');
  console.log('2. 如果消息传递失败，请检查扩展权限和background.js');
  console.log('3. 如果登录失败但消息传递成功，请检查用户名密码');
}

// 清除所有数据并重新测试
async function resetAndTest() {
  console.log('🔄 === 重置并重新测试 ===');
  
  // 清除存储
  await chrome.storage.local.clear();
  console.log('✅ 存储已清除');
  
  // 重新运行诊断
  await diagnoseLoginIssue();
}

// 导出函数
window.diagnoseLoginIssue = diagnoseLoginIssue;
window.resetAndTest = resetAndTest;

console.log('🔧 诊断脚本已加载');
console.log('可用命令:');
console.log('- diagnoseLoginIssue(): 运行完整诊断');
console.log('- resetAndTest(): 清除数据并重新测试');