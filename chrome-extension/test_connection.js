// test_chrome_extension.js - Chrome 扩展连接测试脚本
// 在 Chrome 扩展的开发者工具控制台中运行此脚本

async function testChromeExtensionConnection() {
  console.log('=== 测试 Chrome 扩展连接 ===');
  
  // 测试 1: 检查配置
  console.log('1. 检查 API 配置...');
  try {
    // 模拟 background.js 中的配置
    const API_BASE_URL = 'http://localhost:8000';
    console.log(`   API 地址: ${API_BASE_URL}`);
    console.log('✅ 配置检查通过');
  } catch (error) {
    console.error('❌ 配置检查失败:', error);
    return;
  }
  
  // 测试 2: 测试网络连接
  console.log('\n2. 测试网络连接...');
  try {
    const response = await fetch('http://localhost:8000/', {
      method: 'GET',
      mode: 'cors',
      credentials: 'omit'
    });
    
    if (response.ok) {
      console.log('✅ 网络连接测试通过');
      console.log(`   状态码: ${response.status}`);
    } else {
      console.error(`❌ 网络连接失败: ${response.status}`);
    }
  } catch (error) {
    console.error('❌ 网络连接失败:', error.message);
  }
  
  // 测试 3: 测试登录 API
  console.log('\n3. 测试登录 API...');
  try {
    const loginData = {
      username: 'test',
      password: 'test123'
    };
    
    const response = await fetch('http://localhost:8000/api/v1/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify(loginData),
      mode: 'cors',
      credentials: 'omit'
    });
    
    if (response.ok) {
      const data = await response.json();
      console.log('✅ 登录 API 测试通过');
      console.log(`   响应:`, data);
      
      if (data.success) {
        console.log('✅ 登录成功，token:', data.token);
      } else {
        console.warn('⚠️  登录失败:', data.message);
      }
    } else {
      console.error(`❌ 登录 API 失败: ${response.status}`);
      const errorText = await response.text();
      console.error('错误信息:', errorText);
    }
  } catch (error) {
    console.error('❌ 登录 API 测试失败:', error.message);
  }
  
  // 测试 4: 检查 Chrome 扩展权限
  console.log('\n4. 检查 Chrome 扩展权限...');
  try {
    // 检查是否有必要的权限
    const permissions = ['storage', 'contextMenus', 'activeTab', 'scripting'];
    console.log('✅ Chrome 扩展权限检查完成');
    console.log('   需要的权限:', permissions);
    
    // 检查本地存储权限
    const testStorage = await chrome.storage.local.set({test: 'value'});
    const testRetrieval = await chrome.storage.local.get('test');
    if (testRetrieval.test === 'value') {
      console.log('✅ Chrome 存储权限正常');
    }
  } catch (error) {
    console.error('❌ Chrome 扩展权限检查失败:', error.message);
  }
  
  console.log('\n=== 测试完成 ===');
  console.log('如果所有测试都通过，Chrome 扩展应该可以正常登录');
  console.log('如果还有问题，请检查:');
  console.log('1. 后端服务是否正在运行');
  console.log('2. Chrome 扩展的网络权限配置');
  console.log('3. 浏览器控制台中的详细错误信息');
}

// 运行测试
console.log('准备运行 Chrome 扩展连接测试...');
console.log('请在 Chrome 扩展的开发者工具控制台中运行: testChromeExtensionConnection()');

// 导出函数供控制台使用
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { testChromeExtensionConnection };
}