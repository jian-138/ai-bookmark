// 网址收藏功能测试脚本
async function testWebPageCollection() {
  console.log('🧪 === 测试网址收藏功能 ===');
  
  // 1. 检查登录状态
  console.log('\n1. 检查登录状态...');
  const storage = await chrome.storage.local.get(['isLoggedIn', 'userId', 'token']);
  
  if (!storage.isLoggedIn || !storage.token) {
    console.log('❌ 用户未登录，请先登录');
    return false;
  }
  
  console.log('✅ 用户已登录');
  console.log('用户ID:', storage.userId);
  console.log('Token:', storage.token ? '已获取' : '缺失');
  
  // 2. 测试网页收藏
  console.log('\n2. 测试网页收藏功能...');
  
  // 模拟当前标签页信息
  const testTab = {
    url: 'https://example.com/test-page',
    title: '测试页面标题'
  };
  
  try {
    console.log('收藏网页:', testTab.url);
    console.log('网页标题:', testTab.title);
    
    const response = await new Promise((resolve, reject) => {
      const timeout = setTimeout(() => reject(new Error('收藏请求超时')), 30000);
      
      chrome.runtime.sendMessage({
        action: 'collect',
        text: '', // 空文本表示收藏整个网页
        url: testTab.url
      }, (response) => {
        clearTimeout(timeout);
        if (chrome.runtime.lastError) {
          reject(new Error(chrome.runtime.lastError.message));
        } else {
          resolve(response);
        }
      });
    });
    
    console.log('收藏响应:', response);
    
    if (response && response.success) {
      console.log('✅ 网页收藏成功！');
      console.log('收藏ID:', response.data?.collect_id || response.data?.collection_id || '未知');
      return true;
    } else {
      console.log('❌ 网页收藏失败:', response?.error || response?.message || '未知错误');
      return false;
    }
    
  } catch (error) {
    console.error('❌ 网页收藏测试失败:', error.message);
    return false;
  }
}

// 测试右键菜单收藏
async function testContextMenuCollection() {
  console.log('\n3. 测试右键菜单收藏功能...');
  
  try {
    // 模拟选中文本收藏
    const selectedText = '这是一段测试文本，用于测试AI书签收藏功能。';
    const currentUrl = window.location.href;
    
    console.log('收藏选中文本:', selectedText.substring(0, 50) + '...');
    console.log('当前页面URL:', currentUrl);
    
    const response = await new Promise((resolve, reject) => {
      const timeout = setTimeout(() => reject(new Error('收藏请求超时')), 30000);
      
      chrome.runtime.sendMessage({
        action: 'collect',
        text: selectedText,
        url: currentUrl
      }, (response) => {
        clearTimeout(timeout);
        if (chrome.runtime.lastError) {
          reject(new Error(chrome.runtime.lastError.message));
        } else {
          resolve(response);
        }
      });
    });
    
    console.log('收藏响应:', response);
    
    if (response && response.success) {
      console.log('✅ 文本收藏成功！');
      console.log('收藏ID:', response.data?.collect_id || response.data?.collection_id || '未知');
      return true;
    } else {
      console.log('❌ 文本收藏失败:', response?.error || response?.message || '未知错误');
      return false;
    }
    
  } catch (error) {
    console.error('❌ 文本收藏测试失败:', error.message);
    return false;
  }
}

// 测试收藏列表加载
async function testCollectionsList() {
  console.log('\n4. 测试收藏列表加载...');
  
  try {
    const response = await new Promise((resolve, reject) => {
      const timeout = setTimeout(() => reject(new Error('加载超时')), 15000);
      
      chrome.runtime.sendMessage({
        action: 'getCollections',
        page: 1,
        size: 10
      }, (response) => {
        clearTimeout(timeout);
        if (chrome.runtime.lastError) {
          reject(new Error(chrome.runtime.lastError.message));
        } else {
          resolve(response);
        }
      });
    });
    
    console.log('收藏列表响应:', response);
    
    if (response && response.success) {
      const items = response.items || response.data || [];
      console.log('✅ 收藏列表加载成功！');
      console.log('收藏数量:', items.length);
      
      if (items.length > 0) {
        console.log('最新收藏:');
        items.slice(0, 3).forEach((item, index) => {
          console.log(`${index + 1}. ${item.ai_category || '未分类'} - ${(item.original_text || '').substring(0, 50)}...`);
        });
      }
      
      return true;
    } else {
      console.log('❌ 收藏列表加载失败:', response?.error || response?.message || '未知错误');
      return false;
    }
    
  } catch (error) {
    console.error('❌ 收藏列表测试失败:', error.message);
    return false;
  }
}

// 运行完整测试
async function runCollectionTests() {
  console.log('🚀 开始运行收藏功能完整测试...');
  
  const results = {
    login: false,
    webpage: false,
    text: false,
    list: false
  };
  
  // 测试登录状态
  const storage = await chrome.storage.local.get(['isLoggedIn', 'userId', 'token']);
  results.login = !!(storage.isLoggedIn && storage.token);
  
  if (!results.login) {
    console.log('❌ 用户未登录，请先登录后再测试收藏功能');
    return results;
  }
  
  console.log('✅ 登录状态正常，开始测试收藏功能...');
  
  // 测试网页收藏
  results.webpage = await testWebPageCollection();
  
  // 测试文本收藏
  results.text = await testContextMenuCollection();
  
  // 测试收藏列表
  results.list = await testCollectionsList();
  
  // 总结
  console.log('\n📊 === 测试结果总结 ===');
  console.log('登录状态:', results.login ? '✅ 正常' : '❌ 异常');
  console.log('网页收藏:', results.webpage ? '✅ 成功' : '❌ 失败');
  console.log('文本收藏:', results.text ? '✅ 成功' : '❌ 失败');
  console.log('收藏列表:', results.list ? '✅ 成功' : '❌ 失败');
  
  const allPassed = Object.values(results).every(result => result === true);
  console.log('\n整体结果:', allPassed ? '✅ 所有测试通过' : '❌ 部分测试失败');
  
  return results;
}

// 导出测试函数
window.testWebPageCollection = testWebPageCollection;
window.testContextMenuCollection = testContextMenuCollection;
window.testCollectionsList = testCollectionsList;
window.runCollectionTests = runCollectionTests;

console.log('🔧 网址收藏功能测试脚本已加载');
console.log('可用命令:');
console.log('- runCollectionTests(): 运行完整收藏功能测试');
console.log('- testWebPageCollection(): 测试网页收藏');
console.log('- testContextMenuCollection(): 测试文本收藏');
console.log('- testCollectionsList(): 测试收藏列表加载');