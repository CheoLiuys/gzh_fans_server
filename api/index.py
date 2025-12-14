from flask import Flask, request, jsonify
import requests
import urllib.parse

app = Flask(__name__)

@app.route('/')
def home():
    return jsonify({"data": "HelloWord", "msg": "success"})

@app.route('/api/fans-query', methods=['POST'])
def fans_query():
    try:
        data = request.get_json()
        
        required_fields = ['account_name', 'token', 'cookie', 'fingerprint']
        for field in required_fields:
            if field not in data:
                return jsonify({
                    "data": {},
                    "msg": f"缺少必需字段: {field}"
                }), 400
        
        # 搜索公众号
        account_info = search_account(
            data['account_name'], 
            data['token'], 
            data['cookie'], 
            data['fingerprint']
        )
        
        if not account_info:
            return jsonify({
                "data": {},
                "msg": "未找到匹配的公众号"
            })
        
        # 获取粉丝数
        fakeid = account_info.get('fakeid', '')
        fans_count = get_fans_count(
            fakeid,
            data['token'],
            data['cookie'],
            data['fingerprint']
        )
        
        result_data = {
            "fans_count": fans_count if fans_count is not None else 0,
            "avatar": account_info.get('round_head_img', ''),
            "wechat_id": account_info.get('alias', ''),
            "signature": account_info.get('signature', ''),
            "nickname": account_info.get('nickname', ''),
            "fakeid": fakeid
        }
        
        return jsonify({
            "data": result_data,
            "msg": "success"
        })
        
    except Exception as e:
        return jsonify({
            "data": {},
            "msg": f"查询失败: {str(e)}"
        }), 500

def search_account(account_name, token, cookie, fingerprint):
    try:
        encoded_name = urllib.parse.quote(account_name)
        url = f"https://mp.weixin.qq.com/cgi-bin/searchbiz?action=search_biz&begin=0&count=5&query={encoded_name}&fingerprint={fingerprint}&token={token}&lang=zh_CN&f=json&ajax=1"
        
        headers = {
            'accept': '*/*',
            'accept-language': 'zh-CN,zh;q=0.9,en;q=0.8',
            'cache-control': 'no-cache',
            'pragma': 'no-cache',
            'user-agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36',
            'x-requested-with': 'XMLHttpRequest',
            'cookie': cookie,
            'referer': f"https://mp.weixin.qq.com/cgi-bin/appmsg?t=media/appmsg_edit_v2&action=edit&isNew=1&type=77&createType=0&token={token}&lang=zh_CN"
        }
        
        response = requests.get(url, headers=headers, timeout=30)
        response.raise_for_status()
        
        data = response.json()
        
        if data.get('base_resp', {}).get('ret') != 0:
            return None
        
        account_list = data.get('list', [])
        if not account_list:
            return None
        
        return account_list[0]
        
    except Exception as e:
        print(f"搜索公众号时出错: {str(e)}")
        return None

def get_fans_count(fakeid, token, cookie, fingerprint):
    try:
        encoded_fakeid = urllib.parse.quote(fakeid)
        url = f"https://mp.weixin.qq.com/cgi-bin/appmsgpublish?sub=list&search_field=null&begin=0&count=5&query=&fakeid={encoded_fakeid}&type=101_1&free_publish_type=1&sub_action=list_ex&fingerprint={fingerprint}&token={token}&lang=zh_CN&f=json&ajax=1"
        
        headers = {
            'accept': '*/*',
            'accept-language': 'zh-CN,zh;q=0.9,en;q=0.8',
            'cache-control': 'no-cache',
            'pragma': 'no-cache',
            'user-agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36',
            'x-requested-with': 'XMLHttpRequest',
            'cookie': cookie,
            'referer': f"https://mp.weixin.qq.com/cgi-bin/appmsg?t=media/appmsg_edit_v2&action=edit&isNew=1&type=77&createType=0&token={token}&lang=zh_CN"
        }
        
        response = requests.get(url, headers=headers, timeout=30)
        response.raise_for_status()
        
        data = response.json()
        
        if data.get('base_resp', {}).get('ret') != 0:
            return None
        
        import json
        publish_page_str = data.get('publish_page', '{}')
        publish_page = json.loads(publish_page_str)
        
        publish_list = publish_page.get('publish_list', [])
        if not publish_list:
            return None
        
        first_publish = publish_list[0]
        publish_info_str = first_publish.get('publish_info', '{}')
        publish_info = json.loads(publish_info_str)
        
        sent_status = publish_info.get('sent_status', {})
        fans_count = sent_status.get('total', 0)
        
        return fans_count
        
    except Exception as e:
        print(f"获取粉丝数时出错: {str(e)}")
        return None

# Vercel serverless function handler
def handler(request):
    return app(request.environ, lambda status, headers: None)

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000)
