#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
真实API密钥检查工具 - 安全版本
"""

import os
import requests
import json
import getpass
from dotenv import load_dotenv

def check_real_api_key():
    """检查真实的API密钥"""
    
    print("=== 硅基流动真实API密钥检查 ===")
    print("⚠️  注意：为了您的账户安全，请确保在安全环境下操作")
    print()
    
    # 提供选项
    print("请选择：")
    print("1. 输入真实API密钥进行测试")
    print("2. 检查当前.env文件中的密钥")
    print("3. 退出")
    
    choice = input("\n请输入选项 (1-3): ").strip()
    
    if choice == "1":
        # 安全输入API密钥
        print("\n请输入您的真实API密钥（输入不会显示）：")
        api_key = getpass.getpass("API密钥: ").strip()
        
        if not api_key:
            print("❌ 未输入API密钥")
            return
            
        # 检查密钥格式
        if len(api_key) < 20:
            print("⚠️  密钥长度较短，可能无效")
        elif 'YOUR_API_KEY' in api_key:
            print("❌ 这看起来像是占位符密钥")
            return
        else:
            print("✅ 密钥格式看起来正常")
            
    elif choice == "2":
        # 加载当前环境变量
        load_dotenv()
        api_key = os.getenv('SILICONFLOW_API_KEY')
        
        if not api_key or 'YOUR_API_KEY' in api_key:
            print("❌ 当前.env文件中是占位符密钥")
            return
        else:
            print(f"✅ 找到已配置的密钥: {api_key[:10]}...")
            
    elif choice == "3":
        print("已退出")
        return
    else:
        print("❌ 无效选项")
        return
    
    # 测试API连接
    print("\n--- 正在测试API连接 ---")
    test_api_connection(api_key)

def test_api_connection(api_key):
    """测试API连接"""
    
    headers = {
        "Authorization": f"Bearer {api_key}",
        "Content-Type": "application/json"
    }
    
    # 测试余额查询
    try:
        print("正在查询账户余额...")
        response = requests.get(
            "https://api.siliconflow.cn/v1/user/balance", 
            headers=headers, 
            timeout=10
        )
        
        if response.status_code == 200:
            data = response.json()
            print("✅ API连接成功！")
            print(f"账户信息: {json.dumps(data, indent=2, ensure_ascii=False)}")
            
            # 检查余额
            if 'balance' in data:
                balance = data['balance']
                print(f"💰 账户余额: {balance}")
                
                if balance <= 0:
                    print("⚠️  账户余额为0，需要充值")
                else:
                    print("✅ 账户余额充足")
                    
            # 检查代金券
            if 'voucher' in data:
                voucher = data['voucher']
                print(f"🎫 代金券余额: {voucher}")
                
        elif response.status_code == 401:
            print(f"❌ 认证失败: {response.text}")
            print("可能原因:")
            print("1. API密钥无效")
            print("2. 密钥已过期")
            print("3. 账户被限制")
            
        elif response.status_code == 403:
            print(f"❌ 权限不足: {response.text}")
            print("您的账户可能没有访问此API的权限")
            
        else:
            print(f"❌ 请求失败: {response.status_code}")
            print(f"响应: {response.text}")
            
    except requests.exceptions.Timeout:
        print("❌ 请求超时")
        print("可能是网络问题或API服务不稳定")
        
    except requests.exceptions.ConnectionError:
        print("❌ 连接失败")
        print("请检查网络连接")
        
    except Exception as e:
        print(f"❌ 发生错误: {str(e)}")

def check_voucher_specific_issues():
    """检查代金券特定问题"""
    
    print("\n=== 代金券常见问题排查 ===")
    
    issues = [
        {
            "问题": "代金券显示但无法使用",
            "排查步骤": [
                "1. 登录硅基流动控制台",
                "2. 进入'费用中心' -> '代金券管理'",
                "3. 查看代金券状态：有效/已用完/已过期",
                "4. 检查使用条件：最低消费、适用产品、有效期",
                "5. 查看使用记录，确认是否已被使用"
            ]
        },
        {
            "问题": "账户显示欠费但有代金券",
            "排查步骤": [
                "1. 检查代金券适用范围（可能仅限特定模型）",
                "2. 确认API调用是否符合代金券使用条件",
                "3. 查看账户欠费金额是否超过代金券面额",
                "4. 检查是否有其他服务在消耗余额",
                "5. 确认代金券是否需要手动激活"
            ]
        },
        {
            "问题": "API调用失败但代金券充足",
            "排查步骤": [
                "1. 检查API密钥权限设置",
                "2. 确认调用的模型是否在代金券范围内",
                "3. 查看API调用频率是否超限",
                "4. 检查请求参数是否正确",
                "5. 尝试使用不同的模型测试"
            ]
        }
    ]
    
    for i, issue in enumerate(issues, 1):
        print(f"\n{i}. {issue['问题']}")
        for step in issue['排查步骤']:
            print(f"   {step}")

def main():
    """主函数"""
    print("🔍 硅基流动代金券问题诊断工具")
    print("=" * 60)
    
    # 检查API密钥
    check_real_api_key()
    
    # 提供代金券排查指南
    check_voucher_specific_issues()
    
    print("\n" + "=" * 60)
    print("📋 建议操作步骤:")
    print("1. 首先确认API密钥有效")
    print("2. 登录控制台检查代金券状态")
    print("3. 查看API调用日志和错误信息")
    print("4. 联系客服时提供详细信息")
    print("\n💡 客服联系方式:")
    print("- 邮箱: support@siliconflow.com")
    print("- 官网: https://cloud.siliconflow.cn")

if __name__ == "__main__":
    main()