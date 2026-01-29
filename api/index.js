require('dotenv').config();
const express = require('express');
const axios = require('axios');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const cache = require('../utils/cache');

const app = express();

// 中间件
app.use(cors());
app.use(express.json());

// 根目录端点 - 返回 index.html
app.get('/', (req, res) => {
  const indexPath = path.join(__dirname, '..', 'index.html');
  
  fs.readFile(indexPath, 'utf8', (err, data) => {
    if (err) {
      console.error('读取 index.html 文件失败:', err);
      return res.status(500).json({
        data: {},
        msg: "服务器内部错误"
      });
    }
    
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.send(data);
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
    
    // 缓存 token 和 fingerprint（异步执行，不阻塞主流程）
    cache.setAuthInfo(data.token, data.fingerprint).catch(err => {
      console.error('缓存认证信息失败:', err.message);
    });
    
    // 先搜索公众号获取 fakeid
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
    
    const fakeid = accountInfo.fakeid || '';
    
    // 缓存公众号信息
    await cache.setGzhInfo(fakeid, accountInfo);
    
    // 尝试从缓存获取粉丝数
    let fansCount = await cache.getFansCount(fakeid);
    
    if (fansCount === null) {
      console.log('📊 缓存未命中，查询粉丝数...');
      
      // 查询粉丝数
      fansCount = await getFansCount(
        fakeid,
        data.token,
        data.cookie,
        data.fingerprint
      );
      
      // 缓存粉丝数
      if (fansCount !== null) {
        await cache.setFansCount(fakeid, fansCount);
      }
    } else {
      console.log('📦 使用缓存的粉丝数');
    }
    
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
    
    console.log('搜索公众号:', accountName);
    console.log('API 返回数据:', JSON.stringify(data, null, 2));
    
    if (data.base_resp && data.base_resp.ret !== 0) {
      console.error('API 返回错误:', data.base_resp);
      return null;
    }
    
    const accountList = data.list || [];
    if (accountList.length === 0) {
      console.error('搜索结果为空');
      return null;
    }
    
    console.log(`找到 ${accountList.length} 个搜索结果`);
    
    // 遍历搜索结果，查找精确匹配的公众号名称
    for (let i = 0; i < accountList.length; i++) {
      const account = accountList[i];
      const nickname = account.nickname || '';
      
      console.log(`结果 ${i + 1}: ${nickname}`);
      
      // 精确匹配公众号名称
      if (nickname === accountName) {
        console.log(`✅ 找到匹配的公众号: ${nickname}`);
        return account;
      }
    }
    
    // 如果没有精确匹配，返回第一个结果
    console.log(`⚠️  未找到精确匹配，返回第一个结果: ${accountList[0].nickname}`);
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
    
    console.log('📊 获取粉丝数 - API 返回数据:', JSON.stringify(data, null, 2));
    
    if (data.base_resp && data.base_resp.ret !== 0) {
      const errorMsg = data.base_resp.err_msg || '未知错误';
      const retCode = data.base_resp.ret;
      
      console.error('❌ API 返回错误:', data.base_resp);
      
      // 特殊错误处理
      if (retCode === 200040 || errorMsg === 'invalid csrf token') {
        console.error('🔒 CSRF Token 失效，需要更新 Cookie');
        throw new Error(`CSRF Token 失效 (错误码: ${retCode})，请更新 Cookie`);
      } else if (retCode === 200006 || errorMsg.includes('cookie')) {
        console.error('🍪 Cookie 无效或已过期');
        throw new Error(`Cookie 无效 (错误码: ${retCode})，请更新 Cookie`);
      }
      
      return null;
    }
    
    const publishPageStr = data.publish_page || '{}';
    console.log('📄 publish_page 字符串长度:', publishPageStr.length);
    
    const publishPage = JSON.parse(publishPageStr);
    console.log('✅ 解析 publish_page 成功:', Object.keys(publishPage));
    
    const publishList = publishPage.publish_list || [];
    console.log(`📋 找到 ${publishList.length} 个发布记录`);
    
    if (publishList.length === 0) {
      console.error('❌ 发布记录列表为空');
      return null;
    }
    
    // 检索所有条目，获取粉丝数的最大值
    let maxFansCount = 0;
    for (let i = 0; i < publishList.length; i++) {
      const publish = publishList[i];
      const publishInfoStr = publish.publish_info || '{}';
      
      console.log(`\n📝 处理记录 ${i + 1}/${publishList.length}`);
      console.log('   publish_info 长度:', publishInfoStr.length);
      
      const publishInfo = JSON.parse(publishInfoStr);
      
      const sentStatus = publishInfo.sent_status || {};
      const currentFansCount = sentStatus.total || 0;
      
      console.log(`   粉丝数: ${currentFansCount}`);
      
      // 更新最大值
      if (currentFansCount > maxFansCount) {
        maxFansCount = currentFansCount;
      }
    }
    
    console.log(`\n🎯 最大粉丝数: ${maxFansCount}`);
    return maxFansCount;
    
  } catch (error) {
    console.error('❌ 获取粉丝数时出错:', error.message);
    console.error('错误堆栈:', error.stack);
    return null;
  }
}

// Vercel serverless function handler
module.exports = (req, res) => {
  app(req, res);
};

// 本地开发时使用
if (require.main === module) {
  const PORT = process.env.PORT || 3000;
  app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
  });
}