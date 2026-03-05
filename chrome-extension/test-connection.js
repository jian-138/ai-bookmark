// Test Chrome Extension with Local Server
// 测试Chrome扩展与本地服务器的连接

// 测试配置
const TEST_CONFIG = {
  local: {
    apiUrl: 'http://localhost:8000',
    name: '本地服务器'
  },
  railway: {
    apiUrl: 'https://ai-bookmark-production-5ecc.up.railway.app',
    name: 'Railway服务器'
  }
};

// 当前测试环境
const CURRENT_TEST_ENV = 'local'; // 可以切换为 'railway' 来测试线上服务

// 测试函数
async function testConnection() {
  console.log(`🧪 开始测试Chrome扩展连接 (${TEST_CONFIG[CURRENT_TEST_ENV].name})`);
  
  const config = TEST_CONFIG[CURRENT_TEST_ENV];
  
  try {
    // 测试健康检查端点
    console.log('📡 测试健康检查端点...');
    const healthResponse = await fetch(`${config.apiUrl}/health`);
    const healthData = await healthResponse.json();
    console.log('✅ 健康检查:', healthData);
    
    // 测试登录功能
    console.log('🔐 测试登录功能...');
    const loginResponse = await fetch(`${config.apiUrl}/api/v1/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        username: 'test',
        password: 'test123'
      })
    });
    
    if (loginResponse.ok) {
      const loginData = await loginResponse.json();
      console.log('✅ 登录成功:', loginData);
      
      // 测试收藏列表
      console.log('📚 测试收藏列表...');
      const collectionsResponse = await fetch(`${config.apiUrl}/api/v1/collections?page=1&size=10`);
      
      if (collectionsResponse.ok) {
        const collectionsData = await collectionsResponse.json();
        console.log('✅ 收藏列表:', collectionsData);
      } else {
        console.log('❌ 收藏列表失败:', collectionsResponse.status);
      }
      
    } else {
      console.log('❌ 登录失败:', loginResponse.status);
    }
    
    console.log(`🎉 测试完成！${config.name} 连接正常`);
    
  } catch (error) {
    console.error(`❌ 测试失败 (${config.name}):`, error.message);
    
    if (error.message.includes('CORS')) {
      console.error('🔧 CORS错误: 请检查服务器CORS配置');
    } else if (error.message.includes('Failed to fetch')) {
      console.error('🔧 网络错误: 请检查服务器是否运行');
    }
  }
}

// 运行测试
testConnection();

// 导出测试函数供其他脚本使用
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { testConnection, TEST_CONFIG };
}