// bot/bot-integrated.js
// WeChat bot integrated with backend API

require('dotenv').config();
const { Wechaty } = require('wechaty');
const axios = require('axios');

// Backend API configuration
const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:8000';

/**
 * Find or create user by wechat_id
 */
async function findOrCreateUser(wechat_id) {
  try {
    // 暂时使用简化版本，直接生成user_id
    // TODO: 实现真实的用户管理系统
    return `usr_wechat_${wechat_id}`;
  } catch (error) {
    console.error('[Bot] Error finding/creating user:', error.message);
    throw error;
  }
}

/**
 * Submit collection to backend
 */
async function submitCollection(user_id, text, url = null) {
  try {
    const response = await axios.post(`${API_BASE_URL}/api/v1/collect`, {
      user_id: user_id,
      original_text: text,
      url: url
    }, {
      timeout: 5000
    });

    return response.data;
  } catch (error) {
    if (error.response) {
      // API returned error
      return {
        success: false,
        code: error.response.data?.code || 'API_ERROR',
        error: error.response.data?.error || '收藏失败'
      };
    }
    return {
      success: false,
      code: 'NETWORK_ERROR',
      error: '无法连接到后端服务'
    };
  }
}

/**
 * Main bot function
 */
async function main() {
  const bot = new Wechaty({
    name: 'ai-bookmark',
    puppet: 'wechaty-puppet-service',
    puppetOptions: { token: process.env.WECHATY_TOKEN },
  });

  // QR code scan event
  bot.on('scan', (qrcode, status) => {
    console.log(`[Bot] Scan QR Code to login: ${status}\nhttps://wechaty.js.org/qrcode/${encodeURIComponent(qrcode)}`);
  });

  // Login event
  bot.on('login', (user) => {
    console.log(`[Bot] User logged in: ${user.name()}`);
  });

  // Logout event
  bot.on('logout', (user) => {
    console.log(`[Bot] User logged out: ${user.name()}`);
  });

  // Message event
  bot.on('message', async (msg) => {
    try {
      // Skip messages from self
      if (msg.self()) {
        return;
      }

      const contact = msg.from();
      const wechat_id = contact?.id || 'unknown';
      const text = msg.text();
      const room = msg.room();

      // 忽略群消息，只处理私聊
      if (room) {
        return;
      }

      console.log(`[Bot] Message from ${contact?.name()}: ${text?.substring(0, 50)}...`);

      // 处理帮助命令
      if (text && (text.includes('帮助') || text.includes('help') || text === '/help')) {
        await msg.say(`📚 AI 收藏夹机器人使用说明：

1. 发送链接：直接发送网页链接，自动收藏
2. 发送文本：发送超过10个字符的文本内容，自动收藏
3. 公众号文章：转发公众号文章，自动收藏
4. 查询帮助：发送“帮助”或“help”

收藏的内容会自动进行 AI 分析，提取关键词和分类。`);
        return;
      }

      // 处理URL类型消息（链接卡片）
      if (msg.type() === bot.Message.Type.Url) {
        try {
          const urlLink = await msg.toUrlLink();
          const url = urlLink.url();
          const title = urlLink.title();
          const description = urlLink.description();
          
          console.log(`[Bot] Received URL card: ${title}`);
          console.log(`[Bot] URL: ${url}`);

          const user_id = await findOrCreateUser(wechat_id);
          const collectionText = `${title}\n${description || ''}`;
          
          const result = await submitCollection(user_id, collectionText, url);

          if (result.success) {
            await msg.say(`✅ 收藏成功！\n📝 标题: ${title}\n🆔 ID: ${result.collect_id}\n🤖 AI 分析中...`);
          } else {
            await msg.say(`❌ 收藏失败: ${result.error}`);
          }
        } catch (error) {
          console.error('[Bot] Error processing URL card:', error);
          await msg.say(`❌ 处理失败: ${error.message}`);
        }
        return;
      }

      // 处理文本消息（含链接或长文本）
      if (msg.type() === bot.Message.Type.Text && text && text.trim().length >= 10) {
        // 检查是否包含URL
        const urlMatch = text.match(/https?:\/\/[^\s]+/);
        const url = urlMatch ? urlMatch[0] : null;
        let cleanText = text.replace(/https?:\/\/[^\s]+/g, '').trim();

        // 如果有URL但没有文本，使用URL作为文本
        if (cleanText.length < 10 && url) {
          cleanText = `链接: ${url}`;
        }

        // 只处理有意义的文本
        if (cleanText.length >= 10) {
          console.log(`[Bot] Received text collection from ${contact?.name()}: ${cleanText.substring(0, 50)}...`);

          try {
            const user_id = await findOrCreateUser(wechat_id);
            const result = await submitCollection(user_id, cleanText, url);

            if (result.success) {
              await msg.say(`✅ 收藏成功！\n🆔 ID: ${result.collect_id}\n🤖 AI 分析中...`);
            } else {
              await msg.say(`❌ 收藏失败: ${result.error}`);
            }
          } catch (error) {
            console.error('[Bot] Error processing text:', error);
            await msg.say(`❌ 处理失败: ${error.message}`);
          }
        }
        return;
      }

    } catch (error) {
      console.error('[Bot] Error handling message:', error);
    }
  });

  // Error event
  bot.on('error', (error) => {
    console.error('[Bot] Error:', error);
  });

  // Start bot
  try {
    await bot.start();
    console.log('🤖 WeChat bot started successfully');
    console.log(`📡 Backend API: ${API_BASE_URL}`);
  } catch (error) {
    console.error('[Bot] Failed to start:', error);
    process.exit(1);
  }
}

// Handle process termination
process.on('SIGINT', async () => {
  console.log('\n[Bot] SIGINT received, stopping bot...');
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('\n[Bot] SIGTERM received, stopping bot...');
  process.exit(0);
});

main().catch(console.error);


