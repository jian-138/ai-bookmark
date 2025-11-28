// bot/bot-integrated.js
// WeChat bot integrated with backend API

require('dotenv').config();
const { Wechaty } = require('wechaty');
const axios = require('axios');

// Backend API configuration
const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:3000';

/**
 * Find or create user by wechat_id
 */
async function findOrCreateUser(wechat_id) {
  try {
    // Try to find user by wechat_id
    const findResponse = await axios.get(`${API_BASE_URL}/api/v1/user/${wechat_id}`, {
      validateStatus: () => true // Don't throw on 404
    });

    if (findResponse.status === 200 && findResponse.data.success) {
      return findResponse.data.data.user_id;
    }

    // Create new user
    const createResponse = await axios.post(`${API_BASE_URL}/api/v1/user`, {
      wechat_id: wechat_id
    });

    if (createResponse.data.success) {
      return createResponse.data.user_id;
    }

    throw new Error('Failed to create user');
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
      const wechat_id = contact?.id || null;
      const text = msg.text();

      // Handle URL messages
      if (msg.type() === Wechaty.Message.Type.URL) {
        const url = msg.url();
        console.log(`[Bot] Received URL: ${url} from ${contact?.name()}`);

        try {
          // Get or create user
          const user_id = await findOrCreateUser(wechat_id);

          // Submit collection (URL as text, with URL metadata)
          const result = await submitCollection(user_id, `链接: ${url}`, url);

          if (result.success) {
            await msg.say(`✅ 收藏成功！\n收藏ID: ${result.collect_id}\nAI 分析中...`);
          } else {
            await msg.say(`❌ 收藏失败: ${result.error}`);
          }
        } catch (error) {
          console.error('[Bot] Error processing URL:', error);
          await msg.say(`❌ 处理失败: ${error.message}`);
        }
        return;
      }

      // Handle text messages (if text is long enough, treat as collection)
      if (msg.type() === Wechaty.Message.Type.Text && text && text.trim().length >= 10) {
        // Check if message contains URL
        const urlMatch = text.match(/https?:\/\/[^\s]+/);
        const url = urlMatch ? urlMatch[0] : null;
        const cleanText = text.replace(/https?:\/\/[^\s]+/g, '').trim();

        // Only process if text is meaningful (not just URL)
        if (cleanText.length >= 10) {
          console.log(`[Bot] Received text collection from ${contact?.name()}: ${cleanText.substring(0, 50)}...`);

          try {
            // Get or create user
            const user_id = await findOrCreateUser(wechat_id);

            // Submit collection
            const result = await submitCollection(user_id, cleanText, url);

            if (result.success) {
              await msg.say(`✅ 收藏成功！\n收藏ID: ${result.collect_id}\nAI 分析中...`);
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

      // Handle other message types or help command
      if (text && (text.includes('帮助') || text.includes('help') || text === '/help')) {
        await msg.say(`📚 AI 收藏夹机器人使用说明：

1. 发送链接：直接发送网页链接，自动收藏
2. 发送文本：发送超过10个字符的文本内容，自动收藏
3. 查询帮助：发送"帮助"或"help"

收藏的内容会自动进行 AI 分析，提取关键词和分类。`);
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


