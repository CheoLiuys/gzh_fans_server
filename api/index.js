const express = require('express');
const axios = require('axios');
const cors = require('cors');

const app = express();

// 中间件
app.use(cors());
app.use(express.json());

// 健康检查端点
app.get('/', (req, res) => {
  res.json({
    data: "Server is running",
    msg: "success"
  });
});

// 粉丝查询端点
app.post('/api/fans-query', async (req, res) => {
  try {
    const data = req.body;
    
    // 验证必需字段
    const requiredFields = ['account_name', 'token', 'cookie', 'fingerprint'];
    for (const field of requiredFields) {
      if (!data[field]) {
        return res.status(400).json({
          data: {},
          msg: `缺少必需字段: ${field}`
        });
      }
    }
    
    // 搜索公众号
    const accountInfo = await searchAccount(
      data.account_name,
      data.token,
      data.cookie,
      data.fingerprint
    );
    
    if (!accountInfo) {
      return res.json({
        data: {},
        msg: "未找到匹配的公众号"
      });
    }
    
    // 获取粉丝数
    const fakeid = accountInfo.fakeid || '';
    const fansCount = await getFansCount(
      fakeid,
      data.token,
      data.cookie,
      data.fingerprint
    );
    
    const resultData = {
      fans_count: fansCount !== null ? fansCount : 0,
      avatar: accountInfo.round_head_img || '',
      wechat_id: accountInfo.alias || '',
      signature: accountInfo.signature || '',
      nickname: accountInfo.nickname || '',
      fakeid: fakeid
    };
    
    res.json({
      data: resultData,
      msg: "success"
    });
    
  } catch (error) {
    console.error('查询失败:', error.message);
    res.status(500).json({
      data: {},
      msg: `查询失败: ${error.message}`
    });
  }
});

// 搜索公众号函数
async function searchAccount(accountName, token, cookie, fingerprint) {
  try {
    const encodedName = encodeURIComponent(accountName);
    const url = `https://mp.weixin.qq.com/cgi-bin/searchbiz?action=search_biz&begin=0&count=5&query=${encodedName}&fingerprint=${fingerprint}&token=${token}&lang=zh_CN&f=json&ajax=1`;
    
    const headers = {
      'accept': '*/*',
      'accept-language': 'zh-CN,zh;q=0.9,en;q=0.8',
      'cache-control': 'no-cache',
      'pragma': 'no-cache',
      'user-agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36',
      'x-requested-with': 'XMLHttpRequest',
      'cookie': cookie,
      'referer': `https://mp.weixin.qq.com/cgi-bin/appmsg?t=media/appmsg_edit_v2&action=edit&isNew=1&type=77&createType=0&token=${token}&lang=zh_CN`
    };
    
    const response = await axios.get(url, { headers, timeout: 30000 });
    const data = response.data;
    
    if (data.base_resp && data.base_resp.ret !== 0) {
      return null;
    }
    
    const accountList = data.list || [];
    if (accountList.length === 0) {
      return null;
    }
    
    return accountList[0];
    
  } catch (error) {
    console.error('搜索公众号时出错:', error.message);
    return null;
  }
}

// 获取粉丝数函数
async function getFansCount(fakeid, token, cookie, fingerprint) {
  try {
    const encodedFakeid = encodeURIComponent(fakeid);
    const url = `https://mp.weixin.qq.com/cgi-bin/appmsgpublish?sub=list&search_field=null&begin=0&count=5&query=&fakeid=${encodedFakeid}&type=101_1&free_publish_type=1&sub_action=list_ex&fingerprint=${fingerprint}&token=${token}&lang=zh_CN&f=json&ajax=1`;
    
    const headers = {
      'accept': '*/*',
      'accept-language': 'zh-CN,zh;q=0.9,en;q=0.8',
      'cache-control': 'no-cache',
      'pragma': 'no-cache',
      'user-agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36',
      'x-requested-with': 'XMLHttpRequest',
      'cookie': cookie,
      'referer': `https://mp.weixin.qq.com/cgi-bin/appmsg?t=media/appmsg_edit_v2&action=edit&isNew=1&type=77&createType=0&token=${token}&lang=zh_CN`
    };
    
    const response = await axios.get(url, { headers, timeout: 30000 });
    const data = response.data;
    
    if (data.base_resp && data.base_resp.ret !== 0) {
      return null;
    }
    
    const publishPageStr = data.publish_page || '{}';
    const publishPage = JSON.parse(publishPageStr);
    
    const publishList = publishPage.publish_list || [];
    if (publishList.length === 0) {
      return null;
    }
    
    const firstPublish = publishList[0];
    const publishInfoStr = firstPublish.publish_info || '{}';
    const publishInfo = JSON.parse(publishInfoStr);
    
    const sentStatus = publishInfo.sent_status || {};
    const fansCount = sentStatus.total || 0;
    
    return fansCount;
    
  } catch (error) {
    console.error('获取粉丝数时出错:', error.message);
    return null;
  }
}

// Vercel serverless function handler
module.exports = (req, res) => {
  app(req, res);
};

// 本地开发时使用
if (require.main === module) {
  const PORT = process.env.PORT || 5000;
  app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
  });
}
