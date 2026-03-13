// config.js - 修复版配置文件
// 确保API地址正确配置

const Config = {
  // 开发环境配置
  development: {
    apiUrl: 'http://localhost:8000',
    name: 'Development'
  },
  
  // 生产环境配置
  production: {
    apiUrl: 'https://ai-bookmark-production-5ecc.up.railway.app',
    name: 'Production'
  }
};

// 当前环境 - 设为'development'或'production'
const CURRENT_ENV = 'production';

// 导出当前配置
const API_CONFIG = Config[CURRENT_ENV];

console.log(`使用${API_CONFIG.name}环境API: ${API_CONFIG.apiUrl}`);

export { API_CONFIG, CURRENT_ENV, Config };