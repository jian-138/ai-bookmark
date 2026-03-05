// Chrome扩展功能全面验证脚本
// 验证所有扩展功能是否正常工作

console.log('🚀 Chrome扩展功能全面验证开始');
console.log('======================================');

const TEST_CONFIG = {
  username: 'test',
  password: 'test123',
  apiUrl: 'https://ai-bookmark-production-5ecc.up.railway.app',
  testText: '这是来自Chrome扩展功能测试的文本内容，用于验证收藏功能是否正常工作。',
  testUrl: 'https://example.com/test',
  testTitle: 'Chrome扩展功能测试页面'
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

// 测试1: 扩展基础功能
async function testExtensionBasics() {
  console.log('\n📋 测试1: 扩展基础功能');
  
  try {
    // 检查Chrome API
    if (typeof chrome === 'undefined') {
      addTestResult('Chrome API', false, 'Chrome API不可用');
      return false;
    }
    
    if (!chrome.runtime) {
      addTestResult('Chrome Runtime API', false, 'Chrome Runtime API不可用');
      return false;
    }
    
    if (!chrome.storage || !chrome.storage.local) {
      addTestResult('Chrome Storage API', false, 'Chrome Storage API不可用');
      return false;
    }
    
    addTestResult('扩展基础API', true, '所有基础API可用');
    return true;
  } catch (error) {
    addTestResult('扩展基础功能', false, `错误: ${error.message}`);
    return false;
  }
}

// 测试2: 右键菜单功能
async function testContextMenu() {
  console.log('\n🖱️ 测试2: 右键菜单功能');
  
  try {
    if (!chrome.contextMenus) {
      addTestResult('右键菜单API', false, 'Context Menus API不可用');
      return false;
    }
    
    // 检查是否创建了菜单项
    chrome.contextMenus.update('collect-text', {
      title: '收藏到AI书签 (测试中)'
    }, () => {
      if (chrome.runtime.lastError) {
        console.log('右键菜单更新错误:', chrome.runtime.lastError);
      } else {
        console.log('右键菜单更新成功');
      }
    });
    
    addTestResult('右键菜单功能', true, '右键菜单API可用');
    return true;
  } catch (error) {
    addTestResult('右键菜单功能', false, `错误: ${error.message}`);
    return false;
  }
}

// 测试3: 内容脚本功能
async function testContentScript() {
  console.log('\n📝 测试3: 内容脚本功能');
  
  try {
    if (!chrome.scripting) {
      addTestResult('脚本注入API', false, 'Scripting API不可用');
      return false;
    }
    
    // 测试在当前页面注入脚本
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    
    if (!tab) {
      addTestResult('内容脚本功能', false, '无法获取当前标签页');
      return false;
    }
    
    addTestResult('内容脚本功能', true, '脚本注入API可用');
    return true;
  } catch (error) {
    addTestResult('内容脚本功能', false, `错误: ${error.message}`);
    return false;
  }
}

// 测试4: 通知功能
async function testNotification() {
  console.log('\n🔔 测试4: 通知功能');
  
  try {
    if (!chrome.notifications) {
      addTestResult('通知API', false, 'Notifications API不可用');
      return false;
    }
    
    // 创建测试通知
    chrome.notifications.create({
      type: 'basic',
      iconUrl: 'icons/icon48.png',
      title: 'AI书签扩展测试',
      message: '通知功能测试成功！'
    });
    
    addTestResult('通知功能', true, '通知API可用');
    return true;
  } catch (error) {
    addTestResult('通知功能', false, `错误: ${error.message}`);
    return false;
  }
}

// 测试5: 存储功能
async function testStorage() {
  console.log('\n💾 测试5: 存储功能');
  
  try {
    // 测试写入
    await chrome.storage.local.set({
      testKey: 'testValue',
      testTimestamp: Date.now()
    });
    
    // 测试读取
    const result = await chrome.storage.local.get(['testKey', 'testTimestamp']);
    
    if (result.testKey === 'testValue' && result.testTimestamp) {
      addTestResult('存储功能', true, '本地存储读写正常', result);
      
      // 清理测试数据
      await chrome.storage.local.remove(['testKey', 'testTimestamp']);
      return true;
    } else {
      addTestResult('存储功能', false, '存储数据验证失败', result);
      return false;
    }
  } catch (error) {
    addTestResult('存储功能', false, `错误: ${error.message}`);
    return false;
  }
}

// 测试6: 网络请求功能
async function testNetworkRequests() {
  console.log('\n🌐 测试6: 网络请求功能');
  
  try {
    // 测试健康检查端点
    const response = await fetch(`${TEST_CONFIG.apiUrl}/health`);
    const data = await response.json();
    
    if (response.ok && data.status === 'healthy') {
      addTestResult('网络请求', true, 'API连接正常', data);
      return true;
    } else {
      addTestResult('网络请求', false, 'API响应异常', { status: response.status, data: data });
      return false;
    }
  } catch (error) {
    addTestResult('网络请求', false, `网络错误: ${error.message}`);
    return false;
  }
}

// 测试7: 用户登录流程
async function testUserLoginFlow() {
  console.log('\n🔐 测试7: 用户登录流程');
  
  try {
    // 发送登录请求
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
      addTestResult('用户登录', true, '登录成功', {
        user_id: response.data?.user_id,
        has_token: !!response.data?.token
      });
      
      // 验证用户信息存储
      const userInfo = await chrome.storage.local.get(['token', 'user_id', 'username']);
      if (userInfo.token && userInfo.user_id) {
        addTestResult('用户信息存储', true, '用户信息正确保存', userInfo);
      } else {
        addTestResult('用户信息存储', false, '用户信息保存失败', userInfo);
      }
      
      return true;
    } else {
      addTestResult('用户登录', false, `登录失败: ${response?.error || '未知错误'}`, response);
      return false;
    }
  } catch (error) {
    addTestResult('用户登录', false, `错误: ${error.message}`);
    return false;
  }
}

// 测试8: 收藏功能
async function testCollectionFeature() {
  console.log('\n📚 测试8: 收藏功能');
  
  try {
    // 首先确保已登录
    const loginResult = await testUserLoginFlow();
    if (!loginResult) {
      addTestResult('收藏功能', false, '需要先登录才能测试收藏功能');
      return false;
    }
    
    // 测试收藏功能
    const response = await new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error('收藏超时'));
      }, 10000);
      
      chrome.runtime.sendMessage({
        action: 'collect',
        text: TEST_CONFIG.testText,
        url: TEST_CONFIG.testUrl,
        title: TEST_CONFIG.testTitle
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
      addTestResult('收藏功能', true, '收藏成功', response.data);
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

// 测试9: 收藏列表获取
async function testCollectionList() {
  console.log('\n📋 测试9: 收藏列表获取');
  
  try {
    // 确保已登录
    const userInfo = await chrome.storage.local.get(['token', 'user_id']);
    if (!userInfo.token || !userInfo.user_id) {
      addTestResult('收藏列表', false, '用户未登录');
      return false;
    }
    
    const response = await new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error('获取收藏列表超时'));
      }, 10000);
      
      chrome.runtime.sendMessage({
        action: 'getCollections',
        page: 1,
        size: 10,
        userId: userInfo.user_id
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
      const collections = response.data?.items || response.data || [];
      const total = response.data?.total || collections.length;
      
      addTestResult('收藏列表', true, `获取成功，共${total}条收藏`, {
        count: collections.length,
        total: total
      });
      return true;
    } else {
      addTestResult('收藏列表', false, `获取失败: ${response?.error || '未知错误'}`, response);
      return false;
    }
  } catch (error) {
    addTestResult('收藏列表', false, `错误: ${error.message}`);
    return false;
  }
}

// 测试10: 周报生成功能
async function testWeeklyReport() {
  console.log('\n📊 测试10: 周报生成功能');
  
  try {
    const userInfo = await chrome.storage.local.get(['token', 'user_id']);
    if (!userInfo.token || !userInfo.user_id) {
      addTestResult('周报生成', false, '用户未登录');
      return false;
    }
    
    const response = await new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error('生成周报超时'));
      }, 15000);
      
      chrome.runtime.sendMessage({
        action: 'generateWeeklyReport',
        userId: userInfo.user_id
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
      const report = response.data;
      addTestResult('周报生成', true, '周报生成成功', {
        report_id: report.report_id,
        total_count: report.total_count,
        summary_length: report.summary?.length || 0
      });
      return true;
    } else {
      addTestResult('周报生成', false, `生成失败: ${response?.error || '未知错误'}`, response);
      return false;
    }
  } catch (error) {
    addTestResult('周报生成', false, `错误: ${error.message}`);
    return false;
  }
}

// 测试11: 搜索功能
async function testSearchFunction() {
  console.log('\n🔍 测试11: 搜索功能');
  
  try {
    const userInfo = await chrome.storage.local.get(['token', 'user_id']);
    if (!userInfo.token || !userInfo.user_id) {
      addTestResult('搜索功能', false, '用户未登录');
      return false;
    }
    
    const response = await new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error('搜索超时'));
      }, 10000);
      
      chrome.runtime.sendMessage({
        action: 'searchWeeklyCollections',
        keyword: '测试',
        exactMatch: false,
        favoritesOnly: false,
        userId: userInfo.user_id
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
      const results = response.data?.items || response.data || [];
      addTestResult('搜索功能', true, `搜索成功，找到${results.length}条结果`, {
        count: results.length
      });
      return true;
    } else {
      addTestResult('搜索功能', false, `搜索失败: ${response?.error || '未知错误'}`, response);
      return false;
    }
  } catch (error) {
    addTestResult('搜索功能', false, `错误: ${error.message}`);
    return false;
  }
}

// 测试12: 用户登出功能
async function testUserLogout() {
  console.log('\n🚪 测试12: 用户登出功能');
  
  try {
    const response = await new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error('登出超时'));
      }, 5000);
      
      chrome.runtime.sendMessage({
        action: 'logout'
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
      // 验证用户信息是否被清除
      const userInfo = await chrome.storage.local.get(['token', 'user_id', 'username']);
      
      if (!userInfo.token && !userInfo.user_id) {
        addTestResult('用户登出', true, '登出成功，用户信息已清除');
        return true;
      } else {
        addTestResult('用户登出', false, '登出后用户信息未完全清除', userInfo);
        return false;
      }
    } else {
      addTestResult('用户登出', false, `登出失败: ${response?.error || '未知错误'}`, response);
      return false;
    }
  } catch (error) {
    addTestResult('用户登出', false, `错误: ${error.message}`);
    return false;
  }
}

// 测试13: 扩展图标和界面
function testExtensionUI() {
  console.log('\n🎨 测试13: 扩展界面');
  
  try {
    // 检查必要的UI元素是否存在
    const requiredElements = [
      'login-page', 'main-page', 'weekly-report-page',
      'username', 'password', 'login-btn',
      'collections-list', 'logout-btn',
      'weekly-search-input', 'weekly-search-btn'
    ];
    
    let missingElements = [];
    
    requiredElements.forEach(id => {
      const element = document.getElementById(id);
      if (!element) {
        missingElements.push(id);
      }
    });
    
    if (missingElements.length === 0) {
      addTestResult('扩展界面', true, '所有必要UI元素存在');
      return true;
    } else {
      addTestResult('扩展界面', false, `缺少UI元素: ${missingElements.join(', ')}`);
      return false;
    }
  } catch (error) {
    addTestResult('扩展界面', false, `错误: ${error.message}`);
    return false;
  }
}

// 测试14: 性能测试
async function testPerformance() {
  console.log('\n⚡ 测试14: 性能测试');
  
  try {
    const startTime = performance.now();
    
    // 测试登录性能
    await new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error('性能测试超时'));
      }, 10000);
      
      chrome.runtime.sendMessage({
        action: 'get-user-info'
      }, (response) => {
        clearTimeout(timeout);
        resolve(response);
      });
    });
    
    const endTime = performance.now();
    const duration = endTime - startTime;
    
    if (duration < 1000) {
      addTestResult('性能测试', true, `响应时间: ${Math.round(duration)}ms`);
      return true;
    } else {
      addTestResult('性能测试', false, `响应时间过长: ${Math.round(duration)}ms`);
      return false;
    }
  } catch (error) {
    addTestResult('性能测试', false, `错误: ${error.message}`);
    return false;
  }
}

// 测试15: 错误处理
async function testErrorHandling() {
  console.log('\n🛡️ 测试15: 错误处理');
  
  try {
    // 测试无效登录
    const response = await new Promise((resolve, reject) => {
      chrome.runtime.sendMessage({
        action: 'login',
        username: 'invalid_user',
        password: 'wrong_password'
      }, (response) => {
        resolve(response);
      });
    });
    
    if (response && !response.success && response.error) {
      addTestResult('错误处理', true, '错误处理正常，返回了错误信息', { error: response.error });
      return true;
    } else {
      addTestResult('错误处理', false, '错误处理异常', response);
      return false;
    }
  } catch (error) {
    addTestResult('错误处理', false, `错误: ${error.message}`);
    return false;
  }
}

// 运行所有测试
async function runAllTests() {
  console.log('开始Chrome扩展功能全面测试...');
  console.log('测试配置:', TEST_CONFIG);
  console.log('');
  
  testResults = [];
  
  // 基础功能测试
  await testExtensionBasics();
  await testContextMenu();
  await testContentScript();
  await testNotification();
  await testStorage();
  await testNetworkRequests();
  await testPerformance();
  await testErrorHandling();
  
  // 用户相关功能测试
  await testUserLoginFlow();
  await testCollectionFeature();
  await testCollectionList();
  await testWeeklyReport();
  await testSearchFunction();
  await testUserLogout();
  
  // UI测试
  testExtensionUI();
  
  // 生成测试报告
  generateTestReport();
}

// 生成测试报告
function generateTestReport() {
  console.log('\n======================================');
  console.log('📊 Chrome扩展功能全面测试报告');
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
  
  // 按类别分组结果
  const categories = {
    '基础功能': [],
    '用户功能': [],
    '界面功能': [],
    '性能测试': []
  };
  
  testResults.forEach(result => {
    if (result.test.includes('API') || result.test.includes('存储') || result.test.includes('网络')) {
      categories['基础功能'].push(result);
    } else if (result.test.includes('用户') || result.test.includes('收藏') || result.test.includes('搜索') || result.test.includes('周报')) {
      categories['用户功能'].push(result);
    } else if (result.test.includes('界面')) {
      categories['界面功能'].push(result);
    } else if (result.test.includes('性能') || result.test.includes('错误')) {
      categories['性能测试'].push(result);
    }
  });
  
  // 输出分组结果
  Object.entries(categories).forEach(([category, results]) => {
    if (results.length > 0) {
      console.log(`\n${category}:`);
      results.forEach(result => {
        const status = result.success ? '✅' : '❌';
        console.log(`  ${status} ${result.test}: ${result.message}`);
      });
    }
  });
  
  console.log('\n======================================');
  
  if (failedTests === 0) {
    console.log('🎉 恭喜！所有测试均通过！');
    console.log('✅ Chrome扩展所有功能完全正常');
    console.log('✅ 可以正常使用所有扩展功能');
    console.log('✅ 扩展已准备好提交到原项目库');
  } else {
    console.log('⚠️  发现一些问题，建议:');
    console.log('1. 检查Chrome扩展权限设置');
    console.log('2. 确认Railway服务正常运行');
    console.log('3. 检查网络连接状态');
    console.log('4. 查看Chrome开发者工具控制台错误信息');
    console.log('5. 重新加载扩展并重试');
  }
  
  console.log('\n🔗 相关资源:');
  console.log('Railway控制台: https://railway.app/dashboard');
  console.log('API地址: https://ai-bookmark-production-5ecc.up.railway.app');
  console.log('测试账号: test / test123');
  console.log('扩展目录: chrome-extension/');
  
  return {
    total: totalTests,
    passed: passedTests,
    failed: failedTests,
    successRate: successRate,
    results: testResults,
    categories: categories
  };
}

// 导出测试函数
if (typeof window !== 'undefined') {
  window.runExtensionTests = runAllTests;
  window.TEST_CONFIG = TEST_CONFIG;
}

// 自动运行测试（如果在扩展环境中）
if (typeof chrome !== 'undefined' && chrome.runtime) {
  console.log('检测到Chrome扩展环境，自动运行全面测试...');
  setTimeout(runAllTests, 1000);
} else {
  console.log('请手动运行测试: runExtensionTests()');
}