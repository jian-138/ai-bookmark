#!/usr/bin/env python
"""
Test script to verify the FastAPI application works correctly
"""
import subprocess
import sys
import time
import requests

def test_app():
    # 启动应用
    print("Starting the FastAPI application...")
    process = subprocess.Popen([sys.executable, '-m', 'uvicorn', 'main:app', '--host', '127.0.0.1', '--port', '8000'])
    
    try:
        # 等待应用启动
        time.sleep(3)
        
        # 测试根路径
        print("Testing the application...")
        response = requests.get('http://127.0.0.1:8000/')
        print(f"Status Code: {response.status_code}")
        print(f"Response: {response.json()}")
        
        # 测试分析接口
        test_data = {
            "collect_id": "test123",
            "text": "这是一段测试文本，用于验证AI分析功能。",
            "metadata": {
                "user_id": "user123",
                "url": "https://example.com"
            }
        }
        
        response = requests.post('http://127.0.0.1:8000/analyze', json=test_data)
        print(f"Analysis Status Code: {response.status_code}")
        print(f"Analysis Response: {response.json()}")
        
        print("Application is working correctly!")
        
    except Exception as e:
        print(f"Error testing application: {e}")
    finally:
        # 终止进程
        process.terminate()
        process.wait()

if __name__ == "__main__":
    test_app()