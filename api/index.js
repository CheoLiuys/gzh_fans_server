require('dotenv').config();
const express = require('express');
const axios = require('axios');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const cache = require('../utils/cache');
const cookieManager = require('../utils/cookieManager');

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
    
    // 添加当前 cookie 到池中（异步执行，不阻塞主流程）
    cookieManager.addCookie(data.cookie).catch(err => {
      console.error('添加 cookie 到池中失败:', err.message);
    });
    
    // 尝试从缓存获取公众号信息
    let accountInfo = null;
    let fakeid = null;
    
    // 先搜索公众号获取 fakeid（这个步骤无法避免）
    accountInfo = await searchAccount(
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
    
    fakeid = accountInfo.fakeid || '';
    
    // 缓存公众号信息
    await cache.setGzhInfo(fakeid, accountInfo);
    
    // 尝试从缓存获取粉丝数
    let fansCount = await cache.getFansCount(fakeid);
    
    if (fansCount === null) {
      console.log('📊 缓存未命中，查询粉丝数...');
      
      // 尝试从 cookie 池获取有效 cookie
      const poolCookie = await cookieManager.getValidCookie(data.token, data.fingerprint);
      const useCookie = poolCookie || data.cookie;
      
      // 查询粉丝数
      fansCount = await getFansCount(
        fakeid,
        data.token,
        useCookie,
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

// Cookie 池状态查询端点（新增）
app.get('/api/cookie-status', async (req, res) => {
  try {
    const status = await cookieManager.getCookiePoolStatus();
    res.json({
      data: status,
      msg: "success"
    });
  } catch (error) {
    console.error('获取 cookie 池状态失败:', error.message);
    res.status(500).json({
      data: {},
      msg: `获取状态失败: ${error.message}`
    });
  }
});

// 清理无效 cookie 端点（新增）
app.post('/api/clean-cookies', async (req, res) => {
  try {
    const count = await cookieManager.cleanInvalidCookies();
    res.json({
      data: { cleaned: count },
      msg: "success"
    });
  } catch (error) {
    console.error('清理 cookie 失败:', error.message);
    res.status(500).json({
      data: {},
      msg: `清理失败: ${error.message}`
    });
  }
});

// 查询所有 cookie 详细信息端点（新增）
app.get('/api/cookie-details', async (req, res) => {
  try {
    const details = await cookieManager.getAllCookieDetails();
    res.json({
      data: details,
      msg: "success"
    });
  } catch (error) {
    console.error('获取 cookie 详细信息失败:', error.message);
    res.status(500).json({
      data: {},
      msg: `获取详细信息失败: ${error.message}`
    });
  }
});

// 粉丝查询端点 - 使用 Cookie 池（新增）
app.post('/api/fans-query-pool', async (req, res) => {
  try {
    const data = req.body;
    
    // 验证必需字段（不需要 cookie）
    const requiredFields = ['account_name', 'token', 'fingerprint'];
    for (const field of requiredFields) {
      if (!data[field]) {
        return res.status(400).json({
          data: {},
          msg: `缺少必需字段: ${field}`
        });
      }
    }
    
    // 缓存 token 和 fingerprint
    await cache.setAuthInfo(data.token, data.fingerprint);
    
    // 从 cookie 池获取有效 cookie
    const poolCookie = await cookieManager.getValidCookie(data.token, data.fingerprint);
    
    if (!poolCookie) {
      return res.status(500).json({
        data: {},
        msg: "Cookie 池中没有有效的 cookie，请先通过 /api/fans-query 添加有效的 cookie"
      });
    }
    
    // 尝试从缓存获取公众号信息
    let accountInfo = null;
    let fakeid = null;
    
    // 先搜索公众号获取 fakeid
    accountInfo = await searchAccount(
      data.account_name,
      data.token,
      poolCookie,
      data.fingerprint
    );
    
    if (!accountInfo) {
      return res.json({
        data: {},
        msg: "未找到匹配的公众号"
      });
    }
    
    fakeid = accountInfo.fakeid || '';
    
    // 缓存公众号信息
    await cache.setGzhInfo(fakeid, accountInfo);
    
    // 尝试从缓存获取粉丝数
    let fansCount = await cache.getFansCount(fakeid);
    
    if (fansCount === null) {
      console.log('📊 缓存未命中，查询粉丝数...');
      
      // 使用 cookie 池中的有效 cookie 查询粉丝数
      fansCount = await getFansCount(
        fakeid,
        data.token,
        poolCookie,
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

// 粉丝查询端点 - 简化版（只需公众号名称）
app.post('/api/fans-query-simple', async (req, res) => {
  try {
    const data = req.body;
    
    // 验证必需字段（只需要公众号名称）
    if (!data.account_name) {
      return res.status(400).json({
        data: {},
        msg: "缺少必需字段: account_name"
      });
    }
    
    // 从缓存获取认证信息
    const authInfo = await cache.getAuthInfo();
    
    if (!authInfo) {
      return res.status(500).json({
        data: {},
        msg: "未找到缓存的认证信息，请先通过 /api/fans-query 接口查询一次以缓存 token 和 fingerprint"
      });
    }
    
    // 从 cookie 池获取有效 cookie
    const poolCookie = await cookieManager.getValidCookie(authInfo.token, authInfo.fingerprint);
    
    if (!poolCookie) {
      return res.status(500).json({
        data: {},
        msg: "Cookie 池中没有有效的 cookie，请先通过 /api/fans-query 添加有效的 cookie"
      });
    }
    
    // 尝试从缓存获取公众号信息
    let accountInfo = null;
    let fakeid = null;
    
    // 先搜索公众号获取 fakeid
    accountInfo = await searchAccount(
      data.account_name,
      authInfo.token,
      poolCookie,
      authInfo.fingerprint
    );
    
    if (!accountInfo) {
      return res.json({
        data: {},
        msg: "未找到匹配的公众号"
      });
    }
    
    fakeid = accountInfo.fakeid || '';
    
    // 缓存公众号信息
    await cache.setGzhInfo(fakeid, accountInfo);
    
    // 尝试从缓存获取粉丝数
    let fansCount = await cache.getFansCount(fakeid);
    
    if (fansCount === null) {
      console.log('📊 缓存未命中，查询粉丝数...');
      
      // 使用 cookie 池中的有效 cookie 查询粉丝数
      fansCount = await getFansCount(
        fakeid,
        authInfo.token,
        poolCookie,
        authInfo.fingerprint
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
    
    // 检索所有条目，获取粉丝数的最大值
    let maxFansCount = 0;
    for (const publish of publishList) {
      const publishInfoStr = publish.publish_info || '{}';
      const publishInfo = JSON.parse(publishInfoStr);
      
      const sentStatus = publishInfo.sent_status || {};
      const currentFansCount = sentStatus.total || 0;
      
      // 更新最大值
      if (currentFansCount > maxFansCount) {
        maxFansCount = currentFansCount;
      }
    }
    
    return maxFansCount;
    
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
  const PORT = process.env.PORT || 3000;
  app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
  });
}
