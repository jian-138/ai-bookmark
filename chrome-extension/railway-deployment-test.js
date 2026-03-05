// Chrome扩展Railway部署测试脚本
// 用于验证Chrome扩展是否正确连接到Railway生产环境

// 测试配置
const RAILWAY_API_URL = 'https://ai-bookmark-production-5ecc.up.railway.app';
const TEST_CREDENTIALS = {
    username: 'test',
    password: 'test123'
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

// 测试1: 基础连接测试
async function testBasicConnection() {
    console.log('🚀 开始基础连接测试...');
    
    try {
        const response = await fetch(`${RAILWAY_API_URL}/health`);
        const data = await response.json();
        
        if (response.ok && data.status === 'healthy') {
            addTestResult('基础连接测试', true, '成功连接到Railway健康检查端点', data);
            return true;
        } else {
            addTestResult('基础连接测试', false, '健康检查失败', { status: response.status, data: data });
            return false;
        }
    } catch (error) {
        addTestResult('基础连接测试', false, '连接失败: ' + error.message);
        return false;
    }
}

// 测试2: API文档访问测试
async function testApiDocumentation() {
    console.log('📚 开始API文档访问测试...');
    
    try {
        const response = await fetch(`${RAILWAY_API_URL}/docs`);
        
        if (response.ok && response.headers.get('content-type')?.includes('text/html')) {
            addTestResult('API文档访问测试', true, 'API文档页面可访问');
            return true;
        } else {
            addTestResult('API文档访问测试', false, 'API文档访问失败', { status: response.status });
            return false;
        }
    } catch (error) {
        addTestResult('API文档访问测试', false, '连接失败: ' + error.message);
        return false;
    }
}

// 测试3: 用户登录测试
async function testUserLogin() {
    console.log('🔐 开始用户登录测试...');
    
    try {
        const response = await fetch(`${RAILWAY_API_URL}/api/v1/auth/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(TEST_CREDENTIALS)
        });
        
        const data = await response.json();
        
        if (response.ok && data.success === true && data.token) {
            addTestResult('用户登录测试', true, '登录成功，获取到有效token', {
                user_id: data.user_id,
                token_length: data.token?.length
            });
            return { success: true, token: data.token, user_id: data.user_id };
        } else {
            addTestResult('用户登录测试', false, '登录失败', { status: response.status, data: data });
            return { success: false };
        }
    } catch (error) {
        addTestResult('用户登录测试', false, '连接失败: ' + error.message);
        return { success: false };
    }
}

// 测试4: 收藏列表获取测试
async function testCollectionsList(token) {
    console.log('📋 开始收藏列表获取测试...');
    
    try {
        const response = await fetch(`${RAILWAY_API_URL}/api/v1/collections`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        const data = await response.json();
        
        if (response.ok && data.success === true) {
            addTestResult('收藏列表获取测试', true, '成功获取收藏列表', {
                total_items: data.total,
                page: data.page,
                items_count: data.items?.length
            });
            return true;
        } else {
            addTestResult('收藏列表获取测试', false, '获取收藏列表失败', { status: response.status, data: data });
            return false;
        }
    } catch (error) {
        addTestResult('收藏列表获取测试', false, '连接失败: ' + error.message);
        return false;
    }
}

// 测试5: 收藏提交测试
async function testCollectionSubmission(token, user_id) {
    console.log('📤 开始收藏提交测试...');
    
    const testData = {
        user_id: user_id,
        original_text: '这是一个测试收藏内容，用于验证Railway部署的Chrome扩展功能。',
        url: 'https://example.com/test-article',
        metadata: {
            source: 'chrome-extension-test',
            timestamp: new Date().toISOString()
        }
    };
    
    try {
        const response = await fetch(`${RAILWAY_API_URL}/api/v1/collect`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(testData)
        });
        
        const data = await response.json();
        
        if (response.ok && data.success === true && data.collect_id) {
            addTestResult('收藏提交测试', true, '成功提交收藏', {
                collect_id: data.collect_id,
                created_at: data.created_at
            });
            return true;
        } else {
            addTestResult('收藏提交测试', false, '提交收藏失败', { status: response.status, data: data });
            return false;
        }
    } catch (error) {
        addTestResult('收藏提交测试', false, '连接失败: ' + error.message);
        return false;
    }
}

// 测试6: 监控指标测试
async function testMetricsEndpoint() {
    console.log('📊 开始监控指标测试...');
    
    try {
        const response = await fetch(`${RAILWAY_API_URL}/metrics`);
        const data = await response.json();
        
        if (response.ok && data.total_collections !== undefined) {
            addTestResult('监控指标测试', true, '成功获取监控指标', {
                total_collections: data.total_collections,
                timestamp: data.timestamp
            });
            return true;
        } else {
            addTestResult('监控指标测试', false, '获取监控指标失败', { status: response.status, data: data });
            return false;
        }
    } catch (error) {
        addTestResult('监控指标测试', false, '连接失败: ' + error.message);
        return false;
    }
}

// 主测试函数
async function runAllTests() {
    console.log('🎯 Chrome扩展Railway部署综合测试');
    console.log('==========================================');
    console.log(`测试时间: ${new Date().toLocaleString()}`);
    console.log(`Railway API: ${RAILWAY_API_URL}`);
    console.log('');
    
    // 重置测试结果
    testResults = [];
    
    // 运行所有测试
    const connectionSuccess = await testBasicConnection();
    
    if (!connectionSuccess) {
        console.log('❌ 基础连接测试失败，停止后续测试');
        return generateFinalReport();
    }
    
    await testApiDocumentation();
    
    const loginResult = await testUserLogin();
    
    if (loginResult.success) {
        await testCollectionsList(loginResult.token);
        await testCollectionSubmission(loginResult.token, loginResult.user_id);
    }
    
    await testMetricsEndpoint();
    
    // 生成最终报告
    generateFinalReport();
}

// 生成最终报告
function generateFinalReport() {
    console.log('');
    console.log('==========================================');
    console.log('📊 测试总结报告');
    console.log('==========================================');
    
    const totalTests = testResults.length;
    const passedTests = testResults.filter(r => r.success).length;
    const failedTests = totalTests - passedTests;
    
    console.log(`总测试数: ${totalTests}`);
    console.log(`通过: ${passedTests}`);
    console.log(`失败: ${failedTests}`);
    console.log(`成功率: ${totalTests > 0 ? Math.round((passedTests / totalTests) * 100) : 0}%`);
    console.log('');
    
    // 详细结果
    console.log('详细测试结果:');
    testResults.forEach(result => {
        const status = result.success ? '✅' : '❌';
        console.log(`${status} ${result.test}: ${result.message}`);
    });
    
    console.log('');
    console.log('==========================================');
    
    if (failedTests === 0) {
        console.log('🎉 恭喜！所有测试均通过！');
        console.log('✅ Chrome扩展已成功连接到Railway生产环境');
        console.log('✅ 所有核心功能正常工作');
        console.log('✅ 部署验证完成');
    } else {
        console.log('⚠️  部分测试失败，请检查:');
        console.log('- Railway服务是否正常运行');
        console.log('- 网络连接是否稳定');
        console.log('- API端点是否正确');
        console.log('- 环境变量是否配置正确');
    }
    
    console.log('');
    console.log('🔗 相关链接:');
    console.log(`Railway控制台: https://railway.app/dashboard`);
    console.log(`GitHub仓库: https://github.com/jian-138/ai-bookmark`);
    console.log(`API文档: ${RAILWAY_API_URL}/docs`);
    
    return {
        total: totalTests,
        passed: passedTests,
        failed: failedTests,
        successRate: totalTests > 0 ? (passedTests / totalTests) : 0,
        results: testResults
    };
}

// 运行测试
if (typeof window !== 'undefined') {
    // 浏览器环境
    window.runRailwayTests = runAllTests;
    console.log('测试函数已加载: window.runRailwayTests()');
} else if (typeof module !== 'undefined' && module.exports) {
    // Node.js环境
    module.exports = { runAllTests, RAILWAY_API_URL };
} else {
    // 直接运行
    runAllTests();
}