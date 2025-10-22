require('dotenv').config();  
const { Wechaty } = require('wechaty');  
async function main() {  
  const bot = new Wechaty({  
    name: 'ai-bookmark',  
    puppet: 'wechaty-puppet-service',  
    puppetOptions: { token: process.env.WECHATY_TOKEN },  
  });  
  bot.on('scan', (qrcode) = ' + qrcode));  
  bot.on('login', (user) = ${user} 登录`));  
  bot.on('message', async (msg) = 
    if (msg.type() === Wechaty.Message.Type.URL) {  
      const url = msg.url();  
      console.log(`收到分享: ${url}`);  
      await msg.say(`? 已收到链接: ${url}\nAI处理中...`);  
    }  
  });  
  await bot.start();  
  console.log('?? 机器人启动成功');  
}  
main().catch(console.error); 
