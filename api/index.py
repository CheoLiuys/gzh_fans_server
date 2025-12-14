from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional, Dict, Any
import httpx
import json
import urllib.parse

app = FastAPI()

# 配置CORS，允许所有来源访问
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 请求模型
class FansQueryRequest(BaseModel):
    account_name: str
    token: str
    cookie: str
    fingerprint: str

# 响应模型
class FansQueryResponse(BaseModel):
    data: Dict[str, Any]
    msg: str

# 微信公众号查询服务
class WeChatFansService:
    def __init__(self):
        self.base_url = "https://mp.weixin.qq.com"
        self.headers = {
            'accept': '*/*',
            'accept-language': 'zh-CN,zh;q=0.9,en;q=0.8',
            'cache-control': 'no-cache',
            'pragma': 'no-cache',
            'priority': 'u=1, i',
            'sec-ch-ua': '"Chromium";v="142", "Google Chrome";v="142", "Not_A Brand";v="99"',
            'sec-ch-ua-mobile': '?0',
            'sec-ch-ua-platform': '"macOS"',
            'sec-fetch-dest': 'empty',
            'sec-fetch-mode': 'cors',
            'sec-fetch-site': 'same-origin',
            'user-agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36',
            'x-requested-with': 'XMLHttpRequest'
        }

    async def search_account(self, account_name: str, token: str, cookie: str, fingerprint: str) -> Optional[Dict[str, Any]]:
        """第一次请求：搜索公众号"""
        try:
            # 构建请求URL
            encoded_name = urllib.parse.quote(account_name)
            url = f"{self.base_url}/cgi-bin/searchbiz?action=search_biz&begin=0&count=5&query={encoded_name}&fingerprint={fingerprint}&token={token}&lang=zh_CN&f=json&ajax=1"
            
            # 设置请求头
            headers = self.headers.copy()
            headers['cookie'] = cookie
            headers['referer'] = f"{self.base_url}/cgi-bin/appmsg?t=media/appmsg_edit_v2&action=edit&isNew=1&type=77&createType=0&token={token}&lang=zh_CN"
            
            async with httpx.AsyncClient(timeout=30.0) as client:
                response = await client.get(url, headers=headers)
                response.raise_for_status()
                
                data = response.json()
                
                # 检查响应状态
                if data.get('base_resp', {}).get('ret') != 0:
                    return None
                
                # 获取公众号列表
                account_list = data.get('list', [])
                if not account_list:
                    return None
                
                # 返回第一个匹配的公众号
                return account_list[0]
                
        except Exception as e:
            print(f"搜索公众号时出错: {str(e)}")
            return None

    async def get_fans_count(self, fakeid: str, token: str, cookie: str, fingerprint: str) -> Optional[int]:
        """第二次请求：获取粉丝数"""
        try:
            # 构建请求URL
            encoded_fakeid = urllib.parse.quote(fakeid)
            url = f"{self.base_url}/cgi-bin/appmsgpublish?sub=list&search_field=null&begin=0&count=5&query=&fakeid={encoded_fakeid}&type=101_1&free_publish_type=1&sub_action=list_ex&fingerprint={fingerprint}&token={token}&lang=zh_CN&f=json&ajax=1"
            
            # 设置请求头
            headers = self.headers.copy()
            headers['cookie'] = cookie
            headers['referer'] = f"{self.base_url}/cgi-bin/appmsg?t=media/appmsg_edit_v2&action=edit&isNew=1&type=77&createType=0&token={token}&lang=zh_CN"
            
            async with httpx.AsyncClient(timeout=30.0) as client:
                response = await client.get(url, headers=headers)
                response.raise_for_status()
                
                data = response.json()
                
                # 检查响应状态
                if data.get('base_resp', {}).get('ret') != 0:
                    return None
                
                # 解析publish_page
                publish_page_str = data.get('publish_page', '{}')
                publish_page = json.loads(publish_page_str)
                
                # 获取发布列表
                publish_list = publish_page.get('publish_list', [])
                if not publish_list:
                    return None
                
                # 获取第一篇文章的发布信息
                first_publish = publish_list[0]
                publish_info_str = first_publish.get('publish_info', '{}')
                publish_info = json.loads(publish_info_str)
                
                # 获取粉丝数
                sent_status = publish_info.get('sent_status', {})
                fans_count = sent_status.get('total', 0)
                
                return fans_count
                
        except Exception as e:
            print(f"获取粉丝数时出错: {str(e)}")
            return None

# 创建服务实例
fans_service = WeChatFansService()

@app.get("/")
async def root():
    return {"data": "HelloWord", "msg": "success"}

@app.get("/api")
async def api_endpoint():
    return {"data": "HelloWord", "msg": "success"}

@app.post("/api/fans-query", response_model=FansQueryResponse)
async def query_fans(request: FansQueryRequest):
    """查询公众号粉丝数"""
    try:
        # 第一次请求：搜索公众号
        account_info = await fans_service.search_account(
            request.account_name, 
            request.token, 
            request.cookie, 
            request.fingerprint
        )
        
        if not account_info:
            return FansQueryResponse(
                data={},
                msg="未找到匹配的公众号"
            )
        
        # 第二次请求：获取粉丝数
        fakeid = account_info.get('fakeid', '')
        fans_count = await fans_service.get_fans_count(
            fakeid,
            request.token,
            request.cookie,
            request.fingerprint
        )
        
        # 构建返回数据
        result_data = {
            "fans_count": fans_count if fans_count is not None else 0,
            "avatar": account_info.get('round_head_img', ''),
            "wechat_id": account_info.get('alias', ''),
            "signature": account_info.get('signature', ''),
            "nickname": account_info.get('nickname', ''),
            "fakeid": fakeid
        }
        
        return FansQueryResponse(
            data=result_data,
            msg="success"
        )
        
    except Exception as e:
        print(f"查询粉丝数时出错: {str(e)}")
        return FansQueryResponse(
            data={},
            msg=f"查询失败: {str(e)}"
        )

# Vercel serverless function handler
handler = app
