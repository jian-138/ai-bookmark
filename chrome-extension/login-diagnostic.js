// Chrome扩展登录问题快速诊断脚本
// 用于快速识别登录失败的具体原因

console.log('🔍 Chrome扩展登录问题快速诊断');
console.log('======================================');

const DIAGNOSTIC_CONFIG = {
  apiUrl: 'https://ai-bookmark-production-5ecc.up.railway.app',
  testUsername: 'test',
  testPassword: 'test123',
  timeout: 10000
};

// 诊断结果存储
let diagnosticResults = [];

function addDiagnostic(testName, status, message, details = null) {
  const result = {
    test: testName,
    status: status,
    message: message,
    timestamp: new Date().toISOString(),
    details: details
  };
  diagnosticResults.push(result);
  
  const icon = status === 'success' ? '✅' : status === 'warning' ? '⚠️' : '❌';
  console.log(`${icon} ${testName}: ${message}`);
  if (details) {
    console.log('详情:', JSON.stringify(details, null, 2));
  }
}

// 1. 检查Chrome扩展环境
function checkExtensionEnvironment() {
  console.log('\n📋 1. 检查Chrome扩展环境...');
  
  try {
    if (typeof chrome === 'undefined') {
      addDiagnostic('Chrome API', 'error', 'chrome对象未定义');
      return false;
    }
    
    if (!chrome.runtime) {
      addDiagnostic('Chrome Runtime', 'error', 'chrome.runtime不可用');
      return false;
    }
    
    if (!chrome.storage || !chrome.storage.local) {
      addDiagnostic('Chrome Storage', 'error', 'chrome.storage不可用');
      return false;
    }
    
    if (!chrome.contextMenus) {
      addDiagnostic('Chrome Context Menus', 'warning', 'chrome.contextMenus可能不可用');
    }
    
    addDiagnostic('扩展环境', 'success', 'Chrome扩展环境正常');
    return true;
  } catch (error) {
    addDiagnostic('扩展环境检查', 'error', error.message);
    return false;
  }
}

// 2. 检查manifest配置
async function checkManifestConfiguration() {
  console.log('\n⚙️ 2. 检查manifest配置...');
  
  try {
    const manifestUrl = chrome.runtime.getURL('manifest.json');
    const response = await fetch(manifestUrl);
    const manifest = await response.json();
    
    // 检查manifest版本
    if (manifest.manifest_version !== 3) {
      addDiagnostic('Manifest版本', 'error', `不支持的版本: ${manifest.manifest_version}`);
      return false;
    }
    
    // 检查host_permissions
    const hasRailwayPermission = manifest.host_permissions?.some(permission => 
      permission.includes('ai-bookmark-production-5ecc.up.railway.app')
    );
    
    if (!hasRailwayPermission) {
      addDiagnostic('Host权限', 'error', '缺少Railway API权限', manifest.host_permissions);
      return false;
    }
    
    // 检查background配置
    if (!manifest.background?.service_worker) {
      addDiagnostic('Background配置', 'error', '缺少service_worker配置');
      return false;
    }
    
    addDiagnostic('Manifest配置', 'success', '配置正确', {
      version: manifest.version,
      permissions: manifest.permissions,
      host_permissions: manifest.host_permissions
    });
    
    return true;
  } catch (error) {
    addDiagnostic('Manifest检查', 'error', error.message);
    return false;
  }
}

// 3. 检查网络连接
async function checkNetworkConnection() {
  console.log('\n🌐 3. 检查网络连接...');
  
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);
    
    const response = await fetch(`${DIAGNOSTIC_CONFIG.apiUrl}/health`, {
      signal: controller.signal,
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    clearTimeout(timeoutId);
    
    if (!response.ok) {
      addDiagnostic('API连接', 'error', `HTTP错误: ${response.status} ${response.statusText}`);
      return false;
    }
    
    const data = await response.json();
    
    if (data.status === 'healthy') {
      addDiagnostic('API连接', 'success', 'Railway API连接正常', data);
      return true;
    } else {
      addDiagnostic('API状态', 'warning', 'API状态异常', data);
      return false;
    }
  } catch (error) {
    if (error.name === 'AbortError') {
      addDiagnostic('网络连接', 'error', '连接超时（5秒）');
    } else if (error.message.includes('Failed to fetch')) {
      addDiagnostic('网络连接', 'error', '网络请求失败，可能是CORS或网络问题');
    } else {
      addDiagnostic('网络连接', 'error', error.message);
    }
    return false;
  }
}

// 4. 检查后台脚本状态
async function checkBackgroundScript() {
  console.log('\n🔧 4. 检查后台脚本状态...');
  
  try {
    return new Promise((resolve) => {
      const timeout = setTimeout(() => {
        addDiagnostic('后台脚本', 'error', '后台脚本响应超时');
        resolve(false);
      }, 3000);
      
      chrome.runtime.sendMessage({ action: 'ping' }, (response) => {
        clearTimeout(timeout);
        
        if (chrome.runtime.lastError) {
          addDiagnostic('后台脚本', 'error', chrome.runtime.lastError.message);
          resolve(false);
        } else if (response && response.pong) {
          addDiagnostic('后台脚本', 'success', '后台脚本响应正常', response);
          resolve(true);
        } else {
          addDiagnostic('后台脚本', 'warning', '后台脚本响应异常', response);
          resolve(false);
        }
      });
    });
  } catch (error) {
    addDiagnostic('后台脚本检查', 'error', error.message);
    return false;
  }
}

// 5. 检查存储状态
async function checkStorageState() {
  console.log('\n💾 5. 检查存储状态...');
  
  try {
    const storageData = await chrome.storage.local.get([
      'token', 'user_id', 'username', 'isLoggedIn', 'lastError'
    ]);
    
    addDiagnostic('存储状态', 'info', '当前存储数据', storageData);
    
    // 检查是否有错误信息
    if (storageData.lastError) {
      addDiagnostic('存储错误', 'warning', '发现之前的错误信息', storageData.lastError);
    }
    
    // 如果已登录，验证token
    if (storageData.token && storageData.user_id) {
      addDiagnostic('登录状态', 'info', '用户已登录', {
        user_id: storageData.user_id,
        username: storageData.username
      });
    } else {
      addDiagnostic('登录状态', 'info', '用户未登录');
    }
    
    return true;
  } catch (error) {
    addDiagnostic('存储检查', 'error', error.message);
    return false;
  }
}

// 6. 模拟登录测试
async function simulateLoginTest() {
  console.log('\n🔐 6. 模拟登录测试...');
  
  try {
    return new Promise((resolve) => {
      const timeout = setTimeout(() => {
        addDiagnostic('登录测试', 'error', '登录超时（10秒）');
        resolve(false);
      }, 10000);
      
      chrome.runtime.sendMessage({
        action: 'login',
        username: DIAGNOSTIC_CONFIG.testUsername,
        password: DIAGNOSTIC_CONFIG.testPassword
      }, (response) => {
        clearTimeout(timeout);
        
        if (chrome.runtime.lastError) {
          addDiagnostic('登录测试', 'error', chrome.runtime.lastError.message);
          resolve(false);
        } else if (response) {
          if (response.success) {
            addDiagnostic('登录测试', 'success', '登录成功', response.data);
            resolve(true);
          } else {
            addDiagnostic('登录测试', 'error', `登录失败: ${response.error || '未知错误'}`, response);
            resolve(false);
          }
        } else {
          addDiagnostic('登录测试', 'error', '无响应数据');
          resolve(false);
        }
      });
    });
  } catch (error) {
    addDiagnostic('登录测试', 'error', error.message);
    return false;
  }
}

// 7. 检查控制台错误
function checkConsoleErrors() {
  console.log('\n📄 7. 检查控制台错误...');
  
  // 获取当前页面的错误信息
  const originalConsoleError = console.error;
  let errorCount = 0;
  const errors = [];
  
  console.error = function(...args) {
    errorCount++;
    errors.push(args.join(' '));
    originalConsoleError.apply(console, arguments);
  };
  
  // 延迟检查错误
  setTimeout(() => {
    console.error = originalConsoleError;
    
    if (errorCount > 0) {
      addDiagnostic('控制台错误', 'warning', `发现 ${errorCount} 个错误`, errors.slice(0, 3));
    } else {
      addDiagnostic('控制台错误', 'success', '未检测到错误');
    }
  }, 1000);
}

// 8. 提供修复建议
function provideFixSuggestions() {
  console.log('\n🔧 8. 修复建议...');
  
  const failures = diagnosticResults.filter(r => r.status === 'error');
  
  if (failures.length === 0) {
    addDiagnostic('修复建议', 'success', '未发现需要修复的问题');
    return;
  }
  
  console.log('根据诊断结果，建议以下修复措施:');
  
  failures.forEach(failure => {
    switch (failure.test) {
      case 'Chrome API':
        console.log('• 确保在Chrome扩展环境中运行此脚本');
        console.log('• 检查扩展是否正确加载');
        break;
      case 'Host权限':
        console.log('• 更新manifest.json中的host_permissions');
        console.log('• 添加Railway API地址到权限列表');
        break;
      case 'API连接':
        console.log('• 检查网络连接');
        console.log('• 确认Railway服务是否运行');
        console.log('• 检查CORS配置');
        break;
      case '后台脚本':
        console.log('• 检查background.js是否正确加载');
        console.log('• 确认service worker是否激活');
        console.log('• 检查background.js中的错误');
        break;
      case '登录测试':
        console.log('• 检查用户名密码是否正确');
        console.log('• 确认API端点是否正确');
        console.log('• 检查网络连接状态');
        break;
    }
  });
}

// 运行完整诊断
async function runFullDiagnosis() {
  console.log('开始Chrome扩展登录问题全面诊断...');
  console.log('诊断配置:', DIAGNOSTIC_CONFIG);
  console.log('');
  
  diagnosticResults = [];
  
  // 运行所有诊断测试
  await checkExtensionEnvironment();
  await checkManifestConfiguration();
  await checkNetworkConnection();
  await checkBackgroundScript();
  await checkStorageState();
  await simulateLoginTest();
  checkConsoleErrors();
  
  // 延迟执行修复建议，等待控制台错误检查完成
  setTimeout(() => {
    provideFixSuggestions();
    generateDiagnosisReport();
  }, 2000);
}

// 生成诊断报告
function generateDiagnosisReport() {
  setTimeout(() => {
    console.log('\n======================================');
    console.log('📊 Chrome扩展登录问题诊断报告');
    console.log('======================================');
    
    const totalTests = diagnosticResults.length;
    const errors = diagnosticResults.filter(r => r.status === 'error').length;
    const warnings = diagnosticResults.filter(r => r.status === 'warning').length;
    const successes = diagnosticResults.filter(r => r.status === 'success').length;
    
    console.log(`总测试数: ${totalTests}`);
    console.log(`✅ 通过: ${successes}`);
    console.log(`⚠️  警告: ${warnings}`);
    console.log(`❌ 错误: ${errors}`);
    
    if (errors === 0) {
      console.log('\n🎉 恭喜！未发现严重问题');
      console.log('扩展应该可以正常工作，如果仍有问题，请检查:');
      console.log('1. 扩展是否正确加载');
      console.log('2. 网络连接是否稳定');
      console.log('3. Railway服务是否正常运行');
    } else {
      console.log('\n⚠️  发现问题，请按照上述建议进行修复');
      console.log('修复后请重新运行诊断测试');
    }
    
    console.log('\n🔗 相关资源:');
    console.log('Railway控制台: https://railway.app/dashboard');
    console.log('API地址: https://ai-bookmark-production-5ecc.up.railway.app');
    console.log('测试账号: test/test123');
    
    return {
      total: totalTests,
      errors: errors,
      warnings: warnings,
      successes: successes,
      results: diagnosticResults
    };
  }, 2500);
}

// 导出诊断函数
if (typeof window !== 'undefined') {
  window.runLoginDiagnosis = runFullDiagnosis;
  window.DIAGNOSTIC_CONFIG = DIAGNOSTIC_CONFIG;
}

// 自动运行诊断（如果在扩展环境中）
if (typeof chrome !== 'undefined' && chrome.runtime) {
  console.log('检测到Chrome扩展环境，自动运行诊断...');
  setTimeout(runFullDiagnosis, 1000);
} else {
  console.log('请手动运行诊断: runLoginDiagnosis()');
  console.log('注意：此脚本需要在Chrome扩展环境中运行');
}