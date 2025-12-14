#!/usr/bin/env python3
"""
调试测试脚本 - 测试API的各个步骤
"""

import requests
import json
import urllib.parse

# API基础URL
BASE_URL = "http://127.0.0.1:8001"

def test_direct_wechat_request():
    """直接测试微信接口请求"""
    print("🔍 直接测试微信接口请求...")
    
    # 测试数据（使用最新的认证信息）
    account_name = "刘坏坏"
    token = "1282161025"
    fingerprint = "524d0cc475f1645c22acfa4b26e407be"
    cookie = "appmsglist_action_3908677324=card; appmsglist_action_3869765355=card; ua_id=ee1ejnK0PjhugA8rAAAAAGWRrFaWtmmwECTVlCBAx70=; wxuin=58724258977014; mm_lang=zh_CN; RK=GDVFseZ+Fx; ptcz=29a91478aac149bfe498282f3e7197c6afb43529f64ee31a59ca23cf9b5d975b; personAgree_3869765355=true; _ga=GA1.1.60873631.1761889148; _qimei_uuid42=19a1f101e2810048aa61dfac3184d3a5608fa27d57; _qimei_fingerprint=524d0cc475f1645c22acfa4b26e407be; _qimei_i_3=6fd951d6c60b04dcc792f666528274e1f1e9a6a0105a0bd4b18b280d239b756b346b31973989e2baa8a9; _qimei_h38=a7bcd07faa61dfac3184d3a503000001d19a1f; _ga_PF3XX5J8LE=GS2.1.s1761899423$o2$g1$t1761899579$j59$l0$h0; _qimei_i_1=5ddc2ed39208038fc190a8610a8272b4a1bff7f2135307d6b7de2d582593206c616336c13980b3dd80b0d9da; pgv_pvid=4443021082; ts_uid=9935166680; pac_uid=0_GG8xw25NBX3ra; omgid=0_GG8xw25NBX3ra; _qimei_q36=; poc_sid=HJ5dKmmj2aIDXXNbKMlOM7uo-W-U7CK6hTA1lxC6; _clck=3869765355|1|g1u|0; rand_info=CAESIPAlL134MWutcvEz5nrlKAG1Ck8h/u/Sh2hIqvU7bXvI; slave_bizuin=3869765355; data_bizuin=3869765355; bizuin=3869765355; data_ticket=11JepvzV7UwtBHbc2mPO/48xqfY5laY1t4osIqMf2XRkmXVJZQ+hbPkQlUeq/Zne; slave_sid=emRsaWk3MTV3bUoxd2Y2NDR6VlJtNGdiRlM0bU42VzNiSndibjFFYmNFeW5hNWJDVm5FeG5CdEZVOFRlV21TdjFITENiNERXbFRIbDU2SlA0b2xQT0l4ZDFpckdRX1VnSmZ5TkNNR3NjaXg5YzVhZ1lwTHJVMk9oVE4xenFLMW9wR3F3UDYzRVZiS0pPaWNp; slave_user=gh_d1243b7c7b11; xid=9724a8f6e0798460595bc44895929624; _clsk=xnybn5|1765697659615|1|1|mp.weixin.qq.com/weheat-agent/payload/record"
    
    # 构建请求URL
    encoded_name = urllib.parse.quote(account_name)
    url = f"https://mp.weixin.qq.com/cgi-bin/searchbiz?action=search_biz&begin=0&count=5&query={encoded_name}&fingerprint={fingerprint}&token={token}&lang=zh_CN&f=json&ajax=1"
    
    headers = {
        'accept': '*/*',
        'accept-language': 'zh-CN,zh;q=0.9,en;q=0.8',
        'cache-control': 'no-cache',
        'cookie': cookie,
        'pragma': 'no-cache',
        'priority': 'u=1, i',
        'referer': f"https://mp.weixin.qq.com/cgi-bin/appmsg?t=media/appmsg_edit_v2&action=edit&isNew=1&type=77&createType=0&token={token}&lang=zh_CN",
        'sec-ch-ua': '"Chromium";v="142", "Google Chrome";v="142", "Not_A Brand";v="99"',
        'sec-ch-ua-mobile': '?0',
        'sec-ch-ua-platform': '"macOS"',
        'sec-fetch-dest': 'empty',
        'sec-fetch-mode': 'cors',
        'sec-fetch-site': 'same-origin',
        'user-agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36',
        'x-requested-with': 'XMLHttpRequest'
    }
    
    print(f"📡 请求URL: {url}")
    print(f"🍪 Cookie长度: {len(cookie)}")
    
    try:
        response = requests.get(url, headers=headers, timeout=30)
        print(f"📊 响应状态码: {response.status_code}")
        print(f"📋 响应头: {dict(response.headers)}")
        
        if response.status_code == 200:
            data = response.json()
            print("✅ 请求成功!")
            print("📋 返回数据:")
            print(json.dumps(data, indent=2, ensure_ascii=False))
            
            # 检查返回结构
            if 'base_resp' in data:
                base_resp = data['base_resp']
                print(f"\n🔍 base_resp.ret: {base_resp.get('ret')}")
                print(f"🔍 base_resp.err_msg: {base_resp.get('err_msg')}")
                
                if base_resp.get('ret') == 0:
                    account_list = data.get('list', [])
                    print(f"🔍 找到公众号数量: {len(account_list)}")
                    
                    if account_list:
                        print("🔍 第一个公众号信息:")
                        first_account = account_list[0]
                        print(f"  - 昵称: {first_account.get('nickname')}")
                        print(f"  - 微信号: {first_account.get('alias')}")
                        print(f"  - fakeid: {first_account.get('fakeid')}")
                        print(f"  - 头像: {first_account.get('round_head_img')[:50]}...")
                        print(f"  - 签名: {first_account.get('signature')}")
                else:
                    print(f"❌ 微信接口返回错误: {base_resp.get('err_msg')}")
            else:
                print("❌ 返回数据格式异常")
        else:
            print(f"❌ 请求失败: {response.status_code}")
            print(f"错误信息: {response.text}")
            
    except Exception as e:
        print(f"❌ 请求异常: {str(e)}")

def test_api_with_mock_data():
    """使用模拟数据测试API"""
    print("\n🎭 使用模拟数据测试API...")
    
    # 创建一个测试端点来模拟成功响应
    test_data = {
        "account_name": "测试公众号",
        "token": "test_token",
        "cookie": "test_cookie",
        "fingerprint": "test_fingerprint"
    }
    
    try:
        response = requests.post(
            f"{BASE_URL}/api/fans-query",
            json=test_data,
            headers={"Content-Type": "application/json"},
            timeout=10
        )
        
        print(f"📊 响应状态码: {response.status_code}")
        
        if response.status_code == 200:
            result = response.json()
            print("✅ API调用成功!")
            print("📋 返回结果:")
            print(json.dumps(result, indent=2, ensure_ascii=False))
        else:
            print(f"❌ API调用失败: {response.status_code}")
            print(f"错误信息: {response.text}")
            
    except Exception as e:
        print(f"❌ 测试失败: {str(e)}")

if __name__ == "__main__":
    test_direct_wechat_request()
    test_api_with_mock_data()
