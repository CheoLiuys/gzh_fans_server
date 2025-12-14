#!/usr/bin/env python3
"""
测试微信公众号粉丝查询API
"""

import requests
import json

# API基础URL
BASE_URL = "http://localhost:8001"

def test_api():
    """测试API功能"""
    
    # 测试数据（使用最新的认证信息）
    test_data = {
        "account_name": "这是一个不存在的公众号",
        "token": "1282161025",
        "cookie": "appmsglist_action_3908677324=card; appmsglist_action_3869765355=card; ua_id=ee1ejnK0PjhugA8rAAAAAGWRrFaWtmmwECTVlCBAx70=; wxuin=58724258977014; mm_lang=zh_CN; RK=GDVFseZ+Fx; ptcz=29a91478aac149bfe498282f3e7197c6afb43529f64ee31a59ca23cf9b5d975b; personAgree_3869765355=true; _ga=GA1.1.60873631.1761889148; _qimei_uuid42=19a1f101e2810048aa61dfac3184d3a5608fa27d57; _qimei_fingerprint=524d0cc475f1645c22acfa4b26e407be; _qimei_i_3=6fd951d6c60b04dcc792f666528274e1f1e9a6a0105a0bd4b18b280d239b756b346b31973989e2baa8a9; _qimei_h38=a7bcd07faa61dfac3184d3a503000001d19a1f; _ga_PF3XX5J8LE=GS2.1.s1761899423$o2$g1$t1761899579$j59$l0$h0; _qimei_i_1=5ddc2ed39208038fc190a8610a8272b4a1bff7f2135307d6b7de2d582593206c616336c13980b3dd80b0d9da; pgv_pvid=4443021082; ts_uid=9935166680; pac_uid=0_GG8xw25NBX3ra; omgid=0_GG8xw25NBX3ra; _qimei_q36=; poc_sid=HJ5dKmmj2aIDXXNbKMlOM7uo-W-U7CK6hTA1lxC6; _clck=3869765355|1|g1u|0; rand_info=CAESIPAlL134MWutcvEz5nrlKAG1Ck8h/u/Sh2hIqvU7bXvI; slave_bizuin=3869765355; data_bizuin=3869765355; bizuin=3869765355; data_ticket=11JepvzV7UwtBHbc2mPO/48xqfY5laY1t4osIqMf2XRkmXVJZQ+hbPkQlUeq/Zne; slave_sid=emRsaWk3MTV3bUoxd2Y2NDR6VlJtNGdiRlM0bU42VzNiSndibjFFYmNFeW5hNWJDVm5FeG5CdEZVOFRlV21TdjFITENiNERXbFRIbDU2SlA0b2xQT0l4ZDFpckdRX1VnSmZ5TkNNR3NjaXg5YzVhZ1lwTHJVMk9oVE4xenFLMW9wR3F3UDYzRVZiS0pPaWNp; slave_user=gh_d1243b7c7b11; xid=9724a8f6e0798460595bc44895929624; _clsk=xnybn5|1765697659615|1|1|mp.weixin.qq.com/weheat-agent/payload/record",
        "fingerprint": "524d0cc475f1645c22acfa4b26e407be"
    }
    
    print("🚀 开始测试微信公众号粉丝查询API...")
    print(f"📡 请求URL: {BASE_URL}/api/fans-query")
    print(f"📝 查询公众号: {test_data['account_name']}")
    print("-" * 50)
    
    try:
        # 发送POST请求
        response = requests.post(
            f"{BASE_URL}/api/fans-query",
            json=test_data,
            headers={"Content-Type": "application/json"},
            timeout=30
        )
        
        print(f"📊 响应状态码: {response.status_code}")
        
        if response.status_code == 200:
            result = response.json()
            print("✅ API调用成功!")
            print("📋 返回结果:")
            print(json.dumps(result, indent=2, ensure_ascii=False))
            
            # 验证返回格式
            if "data" in result and "msg" in result:
                print("\n✅ 返回格式正确")
                
                if result["msg"] == "success":
                    data = result["data"]
                    print(f"🎯 粉丝数: {data.get('fans_count', 'N/A')}")
                    print(f"👤 昵称: {data.get('nickname', 'N/A')}")
                    print(f"🆔 微信号: {data.get('wechat_id', 'N/A')}")
                    print(f"📝 签名: {data.get('signature', 'N/A')}")
                    print(f"🖼️  头像: {data.get('avatar', 'N/A')[:50]}...")
                else:
                    print(f"⚠️  API返回错误: {result['msg']}")
            else:
                print("❌ 返回格式不正确")
        else:
            print(f"❌ API调用失败: {response.status_code}")
            print(f"错误信息: {response.text}")
            
    except requests.exceptions.Timeout:
        print("⏰ 请求超时")
    except requests.exceptions.ConnectionError:
        print("🔌 连接错误，请确保服务器正在运行")
    except Exception as e:
        print(f"❌ 测试失败: {str(e)}")

def test_health():
    """测试健康检查端点"""
    print("\n🏥 测试健康检查端点...")
    try:
        response = requests.get(f"{BASE_URL}/")
        if response.status_code == 200:
            print("✅ 健康检查通过")
            print(f"📋 返回: {response.json()}")
        else:
            print(f"❌ 健康检查失败: {response.status_code}")
    except Exception as e:
        print(f"❌ 健康检查错误: {str(e)}")

if __name__ == "__main__":
    # test_health()
    test_api()
