// 配置文件 - API设置
const Config = {
  // 开发环境配置
  development: {
    apiUrl: 'http://localhost:8001',  // 更新为实际运行的端口
    name: 'Development'
  },
  
  // 生产环境配置
  production: {
    apiUrl: 'https://ai-bookmark-production.up.railway.app',
    name: 'Production'
  }
};

// 当前环境 - 设为'development'或'production'
const CURRENT_ENV = 'development';

// 导出当前配置
const API_CONFIG = Config[CURRENT_ENV];

console.log(`使用${API_CONFIG.name}环境API: ${API_CONFIG.apiUrl}`);

export { API_CONFIG };