from dotenv import load_dotenv
import os

load_dotenv()  # 会自动读取当前目录下的 .env 文件

key = os.getenv("GEMINI_API_KEY")
if key:
    print("GEMINI_API_KEY 已读取成功！")
    print(key)  # 测试时可以输出
else:
    print("未读取到 GEMINI_API_KEY")
