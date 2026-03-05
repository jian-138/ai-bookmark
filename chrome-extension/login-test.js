// Chrome扩展登录测试脚本
// 用于验证登录功能是否正常工作

console.log('🚀 Chrome扩展登录功能测试开始');
console.log('======================================');

// 测试配置
const TEST_CONFIG = {
  username: 'test',
  password: 'test123',
  apiUrl: 'https://ai-bookmark-production-5ecc.up.railway.app'
};

// 测试结果记录
let testResults = [];

// 添加测试结果
function addTestResult(testName, success, message, data = null) {
  const result = {
    test: testName,
    success: success,
    message: message,
    timestamp: new Date().toISOString(),
    data: data
  };
  testResults.push(result);
  
  const status = success ? '✅' : '❌';
  console.log(`${status} ${testName}: ${message}`);
  if (data) {
    console.log('数据:', JSON.stringify(data, null, 2));
  }
}

// 测试1: 检查扩展状态
function testExtensionStatus() {
  console.log('\n📋 测试1: 扩展状态检查');
  
  try {
    if (typeof chrome !== 'undefined' && chrome.runtime) {
      addTestResult('扩展API可用', true, 'Chrome扩展API正常加载');
      return true;
    } else {
      addTestResult('扩展API可用', false, 'Chrome扩展API不可用');
      return false;
    }
  } catch (error) {
    addTestResult('扩展API可用', false, `错误: ${error.message}`);
    return false;
  }
}

// 测试2: 检查本地存储
async function testLocalStorage() {
  console.log('\n💾 测试2: 本地存储检查');
  
  try {
    if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
      const result = await chrome.storage.local.get(['test']);
      addTestResult('本地存储可用', true, 'Chrome本地存储API正常');
      return true;
    } else {
      addTestResult('本地存储可用', false, 'Chrome本地存储API不可用');
      return false;
    }
  } catch (error) {
    addTestResult('本地存储可用', false, `错误: ${error.message}`);
    return false;
  }
}

// 测试3: 测试后台脚本通信
async function testBackgroundCommunication() {
  console.log('\n📡 测试3: 后台脚本通信');
  
  try {
    const response = await new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error('通信超时'));
      }, 5000);
      
      chrome.runtime.sendMessage({
        action: 'get-user-info'
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
      addTestResult('后台通信', true, '与后台脚本通信正常', response.data);
      return true;
    } else {
      addTestResult('后台通信', false, '后台脚本响应异常', response);
      return false;
    }
  } catch (error) {
    addTestResult('后台通信', false, `错误: ${error.message}`);
    return false;
  }
}

// 测试4: 测试登录功能
async function testLoginFunction() {
  console.log('\n🔐 测试4: 登录功能测试');
  
  try {
    const response = await new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error('登录超时'));
      }, 10000);
      
      chrome.runtime.sendMessage({
        action: 'login',
        username: TEST_CONFIG.username,
        password: TEST_CONFIG.password
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
      addTestResult('登录功能', true, '登录成功', {
        user_id: response.data?.user_id,
        has_token: !!response.data?.token
      });
      return true;
    } else {
      addTestResult('登录功能', false, `登录失败: ${response?.error || '未知错误'}`, response);
      return false;
    }
  } catch (error) {
    addTestResult('登录功能', false, `错误: ${error.message}`);
    return false;
  }
}

// 测试5: 测试API连接
async function testAPIConnection() {
  console.log('\n🌐 测试5: API连接测试');
  
  try {
    const response = await fetch(`${TEST_CONFIG.apiUrl}/health`);
    const data = await response.json();
    
    if (response.ok && data.status === 'healthy') {
      addTestResult('API连接', true, 'Railway API连接正常', data);
      return true;
    } else {
      addTestResult('API连接', false, 'Railway API响应异常', { status: response.status, data: data });
      return false;
    }
  } catch (error) {
    addTestResult('API连接', false, `连接错误: ${error.message}`);
    return false;
  }
}

// 测试6: 测试用户信息获取
async function testUserInfoRetrieval() {
  console.log('\n👤 测试6: 用户信息获取');
  
  try {
    const response = await new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error('获取用户信息超时'));
      }, 5000);
      
      chrome.runtime.sendMessage({
        action: 'get-user-info'
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
      addTestResult('用户信息', true, '用户信息获取正常', response.data);
      return true;
    } else {
      addTestResult('用户信息', false, '用户信息获取失败', response);
      return false;
    }
  } catch (error) {
    addTestResult('用户信息', false, `错误: ${error.message}`);
    return false;
  }
}

// 测试7: 测试收藏功能
async function testCollectionFunction() {
  console.log('\n📚 测试7: 收藏功能测试');
  
  try {
    // 首先测试登录
    const loginResult = await testLoginFunction();
    if (!loginResult) {
      addTestResult('收藏功能', false, '需要先登录才能测试收藏功能');
      return false;
    }
    
    const response = await new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error('收藏超时'));
      }, 10000);
      
      chrome.runtime.sendMessage({
        action: 'collect',
        text: '这是来自Chrome扩展测试的收藏内容',
        url: 'https://example.com/test',
        title: '测试收藏'
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
      addTestResult('收藏功能', true, '收藏功能正常');
      return true;
    } else {
      addTestResult('收藏功能', false, `收藏失败: ${response?.error || '未知错误'}`, response);
      return false;
    }
  } catch (error) {
    addTestResult('收藏功能', false, `错误: ${error.message}`);
    return false;
  }
}

// 测试8: 检查配置文件
function testConfiguration() {
  console.log('\n⚙️ 测试8: 配置文件检查');
  
  try {
    // 检查config.js中的配置
    if (typeof API_CONFIG !== 'undefined') {
      const isProduction = API_CONFIG.apiUrl.includes('ai-bookmark-production');
      addTestResult('配置文件', true, '配置文件已加载', {
        environment: isProduction ? 'production' : 'development',
        apiUrl: API_CONFIG.apiUrl
      });
      return true;
    } else {
      addTestResult('配置文件', false, '配置文件未加载');
      return false;
    }
  } catch (error) {
    addTestResult('配置文件', false, `错误: ${error.message}`);
    return false;
  }
}

// 运行所有测试
async function runAllTests() {
  console.log('开始Chrome扩展登录功能全面测试...');
  console.log('测试配置:', TEST_CONFIG);
  console.log('');
  
  testResults = [];
  
  // 运行所有测试
  await testExtensionStatus();
  await testLocalStorage();
  await testBackgroundCommunication();
  await testAPIConnection();
  await testConfiguration();
  await testLoginFunction();
  await testUserInfoRetrieval();
  await testCollectionFunction();
  
  // 生成测试报告
  generateTestReport();
}

// 生成测试报告
function generateTestReport() {
  console.log('\n======================================');
  console.log('📊 Chrome扩展登录功能测试报告');
  console.log('======================================');
  
  const totalTests = testResults.length;
  const passedTests = testResults.filter(r => r.success).length;
  const failedTests = totalTests - passedTests;
  const successRate = totalTests > 0 ? Math.round((passedTests / totalTests) * 100) : 0;
  
  console.log(`总测试数: ${totalTests}`);
  console.log(`通过: ${passedTests}`);
  console.log(`失败: ${failedTests}`);
  console.log(`成功率: ${successRate}%`);
  console.log('');
  
  // 详细结果
  console.log('详细测试结果:');
  testResults.forEach(result => {
    const status = result.success ? '✅' : '❌';
    console.log(`${status} ${result.test}: ${result.message}`);
  });
  
  console.log('');
  console.log('======================================');
  
  if (failedTests === 0) {
    console.log('🎉 恭喜！所有测试均通过！');
    console.log('✅ Chrome扩展登录功能完全正常');
    console.log('✅ 可以正常连接到Railway生产环境');
    console.log('✅ 用户登录、收藏等功能正常工作');
  } else {
    console.log('⚠️  发现一些问题，建议:');
    console.log('1. 检查Chrome扩展是否正确加载');
    console.log('2. 确认Railway服务是否正常运行');
    console.log('3. 检查网络连接是否稳定');
    console.log('4. 查看Chrome开发者工具控制台错误信息');
  }
  
  console.log('');
  console.log('🔗 相关链接:');
  console.log('Railway控制台: https://railway.app/dashboard');
  console.log('API地址: https://ai-bookmark-production-5ecc.up.railway.app');
  console.log('测试账号: test / test123');
  
  return {
    total: totalTests,
    passed: passedTests,
    failed: failedTests,
    successRate: successRate,
    results: testResults
  };
}

// 导出测试函数供外部使用
if (typeof window !== 'undefined') {
  window.runLoginTests = runAllTests;
  window.TEST_CONFIG = TEST_CONFIG;
}

// 自动运行测试（如果在扩展环境中）
if (typeof chrome !== 'undefined' && chrome.runtime) {
  console.log('检测到Chrome扩展环境，自动运行测试...');
  setTimeout(runAllTests, 1000);
} else {
  console.log('请手动运行测试: runLoginTests()');
}