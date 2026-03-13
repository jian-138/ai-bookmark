// 增强版Chrome扩展登录诊断脚本
async function enhancedLoginDiagnosis() {
  console.log('🔍 === 增强版Chrome扩展登录诊断 ===');
  
  // 1. 检查Chrome扩展基本信息
  console.log('\n📋 1. Chrome扩展基本信息:');
  console.log('扩展ID:', chrome.runtime.id);
  console.log('扩展版本:', chrome.runtime.getManifest().version);
  console.log('扩展名称:', chrome.runtime.getManifest().name);
  
  // 2. 检查网络权限
  console.log('\n🔐 2. 网络权限检查:');
  const manifest = chrome.runtime.getManifest();
  const hostPermissions = manifest.host_permissions || [];
  console.log('主机权限:', hostPermissions);
  
  const hasLocalhost = hostPermissions.some(p => p.includes('localhost:8000') || p.includes('127.0.0.1:8000'));
  console.log('本地主机权限:', hasLocalhost ? '✅ 已配置' : '❌ 缺失');
  
  // 3. 测试网络连接
  console.log('\n🌐 3. 网络连接测试:');
  const testUrls = [
    'http://localhost:8000/',
    'http://127.0.0.1:8000/',
    'http://localhost:8000/api/v1/auth/login',
    'http://127.0.0.1:8000/api/v1/auth/login'
  ];
  
  for (const url of testUrls) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);
      
      const response = await fetch(url, {
        method: 'GET',
        signal: controller.signal,
        mode: 'cors'
      }).finally(() => clearTimeout(timeoutId));
      
      console.log(`✅ ${url} - 状态: ${response.status}`);
    } catch (error) {
      console.log(`❌ ${url} - 错误: ${error.message}`);
    }
  }
  
  // 4. 检查Chrome存储状态
  console.log('\n💾 4. Chrome存储状态:');
  try {
    const storage = await chrome.storage.local.get(['isLoggedIn', 'userId', 'token', 'loginError']);
    console.log('当前存储:', storage);
    
    if (storage.loginError) {
      console.log('上次登录错误:', storage.loginError);
    }
  } catch (error) {
    console.error('存储访问失败:', error);
  }
  
  // 5. 测试background.js通信
  console.log('\n📨 5. 测试background.js通信:');
  try {
    console.log('发送ping消息...');
    const pingResponse = await new Promise((resolve, reject) => {
      const timeout = setTimeout(() => reject(new Error('ping超时')), 5000);
      
      chrome.runtime.sendMessage({action: 'ping'}, (response) => {
        clearTimeout(timeout);
        if (chrome.runtime.lastError) {
          reject(new Error(chrome.runtime.lastError.message));
        } else {
          resolve(response);
        }
      });
    });
    
    console.log('ping响应:', pingResponse);
  } catch (error) {
    console.error('background.js通信失败:', error.message);
  }
  
  // 6. 测试完整登录流程
  console.log('\n🔑 6. 测试完整登录流程:');
  try {
    console.log('开始登录测试...');
    
    const loginResponse = await new Promise((resolve, reject) => {
      const timeout = setTimeout(() => reject(new Error('登录超时（20秒）')), 20000);
      
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
    
    console.log('登录响应:', loginResponse);
    
    if (loginResponse && loginResponse.success) {
      console.log('✅ 登录成功！');
      console.log('用户ID:', loginResponse.user_id);
      console.log('Token:', loginResponse.token ? '已获取' : '缺失');
      
      // 保存登录信息
      await chrome.storage.local.set({
        token: loginResponse.token,
        userId: loginResponse.user_id,
        isLoggedIn: true
      });
      
      console.log('✅ 登录信息已保存');
    } else {
      console.log('❌ 登录失败:', loginResponse?.error || loginResponse?.message || '未知错误');
      
      // 保存错误信息
      await chrome.storage.local.set({
        loginError: {
          timestamp: new Date().toISOString(),
          error: loginResponse?.error || loginResponse?.message || '未知错误',
          response: loginResponse
        }
      });
    }
  } catch (error) {
    console.error('❌ 登录测试失败:', error.message);
    
    // 保存错误信息
    await chrome.storage.local.set({
      loginError: {
        timestamp: new Date().toISOString(),
        error: error.message,
        type: error.name
      }
    });
  }
  
  // 7. 检查background.js日志
  console.log('\n📄 7. 检查background.js日志:');
  try {
    // 获取background页面
    const backgroundPage = await chrome.runtime.getBackgroundPage();
    if (backgroundPage && backgroundPage.console) {
      console.log('background.js控制台可用');
    } else {
      console.log('无法直接访问background.js控制台');
    }
  } catch (error) {
    console.log('无法访问background页面:', error.message);
  }
  
  console.log('\n🔍 === 诊断完成 ===');
  
  // 提供解决方案
  console.log('\n💡 解决方案建议:');
  console.log('1. 如果网络连接测试失败:');
  console.log('   - 确保后端服务正在运行: python main.py');
  console.log('   - 检查防火墙设置');
  console.log('   - 尝试重启后端服务');
  
  console.log('\n2. 如果background.js通信失败:');
  console.log('   - 重新加载Chrome扩展');
  console.log('   - 检查扩展权限设置');
  console.log('   - 查看扩展的开发者工具日志');
  
  console.log('\n3. 如果登录超时:');
  console.log('   - 检查网络延迟');
  console.log('   - 增加超时时间设置');
  console.log('   - 检查后端服务响应时间');
  
  console.log('\n4. 通用排查步骤:');
  console.log('   - 打开扩展的开发者工具查看详细日志');
  console.log('   - 检查background.js控制台输出');
  console.log('   - 验证API端点是否可访问');
}

// 快速测试函数
async function quickTest() {
  console.log('⚡ 快速测试登录功能...');
  
  try {
    const response = await new Promise((resolve, reject) => {
      const timeout = setTimeout(() => reject(new Error('超时')), 10000);
      
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
    
    if (response && response.success) {
      console.log('✅ 登录成功');
      return true;
    } else {
      console.log('❌ 登录失败:', response?.error || response?.message);
      return false;
    }
  } catch (error) {
    console.error('❌ 测试失败:', error.message);
    return false;
  }
}

// 清除登录错误
async function clearLoginError() {
  await chrome.storage.local.remove(['loginError']);
  console.log('✅ 登录错误信息已清除');
}

// 导出函数
window.enhancedLoginDiagnosis = enhancedLoginDiagnosis;
window.quickTest = quickTest;
window.clearLoginError = clearLoginError;

console.log('🔧 增强版登录诊断脚本已加载');
console.log('可用命令:');
console.log('- enhancedLoginDiagnosis(): 运行完整诊断');
console.log('- quickTest(): 快速测试登录');
console.log('- clearLoginError(): 清除登录错误信息');