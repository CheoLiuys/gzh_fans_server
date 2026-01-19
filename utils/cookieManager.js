const { Redis } = require('@upstash/redis');
const axios = require('axios');

const COOKIE_POOL_KEY = 'cookie:pool';
const COOKIE_STATUS_KEY = 'cookie:status';
const NOTIFICATION_COUNT_KEY = 'notification:count';
const MAX_COOKIE_VERSIONS = 6; // 最新 + 5 个历史版本
const CACHE_VALIDITY_TIME = 30 * 60; // 30 分钟缓存验证结果
const MAX_DAILY_NOTIFICATIONS = 2; // 每天最多 2 次通知

let redis = null;

/**
 * 初始化 Redis
 */
function initRedis() {
  if (redis) return redis;
  
  const restUrl = process.env.UPSTASH_REDIS_REST_URL;
  const restToken = process.env.UPSTASH_REDIS_REST_TOKEN;
  
  if (restUrl && restToken) {
    try {
      redis = new Redis({
        url: restUrl,
        token: restToken,
      });
    } catch (error) {
      console.error('Redis 初始化失败:', error.message);
      redis = null;
    }
  }
  
  return redis;
}

/**
 * 添加新的 cookie 到池中
 */
async function addCookie(cookie) {
  const client = initRedis();
  if (!client) return false;
  
  try {
    const cookieData = {
      cookie: cookie,
      timestamp: Date.now(),
      isValid: null, // 未知状态
      lastChecked: 0,
    };
    
    // 添加到列表头部（最新）
    await client.lpush(COOKIE_POOL_KEY, JSON.stringify(cookieData));
    
    // 保持最多 MAX_COOKIE_VERSIONS 个版本
    await client.ltrim(COOKIE_POOL_KEY, 0, MAX_COOKIE_VERSIONS - 1);
    
    // 同时存储到 hash 中便于查找和更新状态
    const cookieKey = hashCookie(cookie);
    await client.hset(COOKIE_STATUS_KEY, cookieKey, JSON.stringify(cookieData));
    
    console.log(`✅ 新 cookie 已添加到池中，当前版本数: ${await client.llen(COOKIE_POOL_KEY)}`);
    return true;
  } catch (error) {
    console.error('添加 cookie 失败:', error.message);
    return false;
  }
}

/**
 * 获取所有 cookie
 */
async function getAllCookies() {
  const client = initRedis();
  if (!client) return [];
  
  try {
    const cookieList = await client.lrange(COOKIE_POOL_KEY, 0, -1);
    const cookies = [];
    
    for (const item of cookieList) {
      try {
        // 跳过空值
        if (!item) continue;
        
        let cookieData;
        
        // 检查数据类型
        if (typeof item === 'string') {
          if (item === '') continue;
          // 如果是字符串，尝试解析 JSON
          cookieData = JSON.parse(item);
        } else if (typeof item === 'object') {
          // 如果已经是对象，直接使用
          cookieData = item;
        } else {
          console.warn('跳过未知类型的数据:', typeof item);
          continue;
        }
        
        // 验证数据结构
        if (cookieData && typeof cookieData === 'object' && cookieData.cookie) {
          cookies.push(cookieData);
        } else {
          console.warn('跳过无效的 cookie 数据结构');
        }
        
      } catch (parseError) {
        console.warn('跳过无效的 cookie 数据:', parseError.message);
        if (typeof item === 'string') {
          console.warn('原始数据:', item.substring(0, 100));
        } else {
          console.warn('原始数据:', JSON.stringify(item).substring(0, 100));
        }
      }
    }
    
    return cookies;
  } catch (error) {
    console.error('获取 cookie 列表失败:', error.message);
    return [];
  }
}

/**
 * 验证 cookie 是否有效（通过搜索公众号"刘坏坏"）
 */
async function validateCookie(cookieData, token, fingerprint) {
  const client = initRedis();
  const cookieKey = hashCookie(cookieData.cookie);
  
  try {
    // 检查缓存
    const now = Date.now();
    if (cookieData.lastChecked > 0 && (now - cookieData.lastChecked) < CACHE_VALIDITY_TIME * 1000) {
      console.log(`📦 使用缓存的验证结果: ${cookieData.isValid ? '有效' : '无效'}`);
      return cookieData.isValid;
    }
    
    // 实际验证
    const accountName = '刘坏坏';
    const encodedName = encodeURIComponent(accountName);
    const url = `https://mp.weixin.qq.com/cgi-bin/searchbiz?action=search_biz&begin=0&count=5&query=${encodedName}&fingerprint=${fingerprint}&token=${token}&lang=zh_CN&f=json&ajax=1`;
    
    const headers = {
      'accept': '*/*',
      'accept-language': 'zh-CN,zh;q=0.9,en;q=0.8',
      'cache-control': 'no-cache',
      'pragma': 'no-cache',
      'user-agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36',
      'x-requested-with': 'XMLHttpRequest',
      'cookie': cookieData.cookie,
      'referer': `https://mp.weixin.qq.com/cgi-bin/appmsg?t=media/appmsg_edit_v2&action=edit&isNew=1&type=77&createType=0&token=${token}&lang=zh_CN`
    };
    
    const response = await axios.get(url, { headers, timeout: 30000 });
    const data = response.data;
    
    // 判断 cookie 是否有效
    const isValid = !(data.base_resp && data.base_resp.ret !== 0);
    
    // 更新验证状态
    cookieData.isValid = isValid;
    cookieData.lastChecked = now;
    
    // 同步到 Redis
    if (client) {
      await client.hset(COOKIE_STATUS_KEY, cookieKey, JSON.stringify(cookieData));
      
      // 更新列表中的数据
      try {
        const cookieList = await client.lrange(COOKIE_POOL_KEY, 0, -1);
        for (let i = 0; i < cookieList.length; i++) {
          let item = cookieList[i];
          
          // 处理不同类型的数据
          if (typeof item === 'string') {
            try {
              item = JSON.parse(item);
            } catch (e) {
              console.error('解析 cookie 数据失败:', e.message);
              continue;
            }
          } else if (typeof item !== 'object' || item === null) {
            console.error('无效的 cookie 数据类型:', typeof item);
            continue;
          }
          
          if (item.cookie && hashCookie(item.cookie) === cookieKey) {
            await client.lset(COOKIE_POOL_KEY, i, JSON.stringify(cookieData));
            console.log(`✅ 已更新索引 ${i} 的 cookie 状态`);
            break;
          }
        }
      } catch (error) {
        console.error('更新 Redis 列表失败:', error.message);
      }
    }
    
    console.log(`${isValid ? '✅' : '❌'} Cookie 验证结果: ${isValid ? '有效' : '无效'}`);
    return isValid;
    
  } catch (error) {
    console.error('验证 cookie 时出错:', error.message);
    
    // 网络错误等情况，标记为无效
    cookieData.isValid = false;
    cookieData.lastChecked = Date.now();
    
    if (client) {
      await client.hset(COOKIE_STATUS_KEY, cookieKey, JSON.stringify(cookieData));
    }
    
    return false;
  }
}

/**
 * 获取有效的 cookie（按时间最早的）
 */
async function getValidCookie(token, fingerprint) {
  const client = initRedis();
  if (!client) return null;
  
  try {
    const cookieList = await getAllCookies();
    if (cookieList.length === 0) {
      console.log('⚠️  Cookie 池为空');
      return null;
    }
    
    // 验证所有 cookie
    let validCookies = [];
    let invalidCookies = [];
    let unknownCookies = [];
    
    for (const cookieData of cookieList) {
      const isValid = await validateCookie(cookieData, token, fingerprint);
      if (isValid === true) {
        validCookies.push(cookieData);
      } else if (isValid === false) {
        invalidCookies.push(cookieData);
      } else {
        unknownCookies.push(cookieData);
      }
    }
    
    console.log(`📊 Cookie 状态: ${validCookies.length} 个有效, ${invalidCookies.length} 个无效, ${unknownCookies.length} 个未验证`);
    
    // 优先使用验证有效的 cookie
    if (validCookies.length > 0) {
      // 选择时间最早的有效 cookie
      validCookies.sort((a, b) => a.timestamp - b.timestamp);
      const selectedCookie = validCookies[0];
      
      // 检查是否需要通知（仅剩 1 个有效 cookie 时）
      if (validCookies.length === 1) {
        await checkAndSendNotification();
      }
      
      console.log(`✅ 使用的有效 cookie (时间: ${new Date(selectedCookie.timestamp).toLocaleString('zh-CN')})`);
      return selectedCookie.cookie;
    }
    
    // 如果没有验证通过的 cookie，使用最新的未验证 cookie
    if (unknownCookies.length > 0) {
      // 选择最新的未验证 cookie
      unknownCookies.sort((a, b) => b.timestamp - a.timestamp);
      const selectedCookie = unknownCookies[0];
      
      console.log(`⚠️  使用的未验证 cookie (时间: ${new Date(selectedCookie.timestamp).toLocaleString('zh-CN')})`);
      console.log('提示: 将在使用时验证此 cookie');
      return selectedCookie.cookie;
    }
    
    // 如果都没有，返回 null
    console.log('❌ 没有可用的 cookie');
    return null;
    
  } catch (error) {
    console.error('获取有效 cookie 失败:', error.message);
    return null;
  }
}

/**
 * 检查并发送 Bark 通知
 */
async function checkAndSendNotification() {
  const client = initRedis();
  if (!client) return;
  
  try {
    const today = new Date().toISOString().split('T')[0];
    const todayKey = `${NOTIFICATION_COUNT_KEY}:${today}`;
    
    // 获取今天已发送的通知次数
    const count = await client.get(todayKey);
    const notificationCount = count ? parseInt(count, 10) : 0;
    
    if (notificationCount >= MAX_DAILY_NOTIFICATIONS) {
      console.log(`⏸️  今日通知已达上限 (${MAX_DAILY_NOTIFICATIONS} 次)，跳过通知`);
      return;
    }
    
    // 发送 Bark 通知
    const barkToken = process.env.BARK_TOKEN || '4aef5100c2af37d87f16dc3112e29a251af2f40d8e6256c23af627049027dfa7';
    const title = encodeURIComponent('⚠️ Cookie 即将失效警告');
    const body = encodeURIComponent(`公众号粉丝查询 API 仅剩 1 个有效 Cookie，请及时添加新的 Cookie 以确保服务正常运行。\n\n当前时间: ${new Date().toLocaleString('zh-CN')}`);
    
    const barkUrl = `https://api.day.app/${barkToken}/${title}/${body}`;
    
    try {
      await axios.get(barkUrl, { timeout: 10000 });
      console.log('✅ Bark 通知发送成功');
      
      // 增加通知计数
      await client.set(todayKey, (notificationCount + 1).toString(), { ex: 24 * 60 * 60 });
    } catch (error) {
      console.error('❌ Bark 通知发送失败:', error.message);
    }
    
  } catch (error) {
    console.error('检查通知失败:', error.message);
  }
}

/**
 * Cookie 哈希函数（用于生成唯一标识）
 */
function hashCookie(cookie) {
  // 简单的 hash 函数，取 cookie 的前 50 个字符 + 长度
  const hash = require('crypto')
    .createHash('md5')
    .update(cookie)
    .digest('hex')
    .substring(0, 16);
  return hash;
}

/**
 * 清理无效的 cookie（可选功能）
 */
async function cleanInvalidCookies() {
  const client = initRedis();
  if (!client) return 0;
  
  try {
    const cookieList = await getAllCookies();
    let cleanedCount = 0;
    
    for (const cookieData of cookieList) {
      if (cookieData.isValid === false) {
        // 从列表中移除
        const cookieKey = hashCookie(cookieData.cookie);
        await client.lrem(COOKIE_POOL_KEY, 0, JSON.stringify(cookieData));
        await client.hdel(COOKIE_STATUS_KEY, cookieKey);
        cleanedCount++;
      }
    }
    
    if (cleanedCount > 0) {
      console.log(`🧹 已清理 ${cleanedCount} 个无效 cookie`);
    }
    
    return cleanedCount;
  } catch (error) {
    console.error('清理无效 cookie 失败:', error.message);
    return 0;
  }
}

/**
 * 获取 cookie 池状态
 */
async function getCookiePoolStatus() {
  const client = initRedis();
  if (!client) return null;
  
  try {
    const cookieList = await getAllCookies();
    const validCount = cookieList.filter(c => c.isValid === true).length;
    const invalidCount = cookieList.filter(c => c.isValid === false).length;
    const unknownCount = cookieList.filter(c => c.isValid === null).length;
    
    return {
      total: cookieList.length,
      valid: validCount,
      invalid: invalidCount,
      unknown: unknownCount,
    };
  } catch (error) {
    console.error('获取 cookie 池状态失败:', error.message);
    return null;
  }
}

/**
 * 获取所有 cookie 的详细信息
 */
async function getAllCookieDetails() {
  const client = initRedis();
  if (!client) {
    return {
      cookies: [],
      total: 0
    };
  }
  
  try {
    const cookieList = await getAllCookies();
    const details = [];
    
    for (let i = 0; i < cookieList.length; i++) {
      const cookieData = cookieList[i];
      
      // 提取 cookie 中的关键信息用于显示
      const cookieInfo = extractCookieInfo(cookieData.cookie);
      
      // 格式化验证状态
      let statusText = '未知';
      if (cookieData.isValid === true) {
        statusText = '有效';
      } else if (cookieData.isValid === false) {
        statusText = '无效';
      }
      
      // 格式化时间
      const createdAt = new Date(cookieData.timestamp);
      const lastChecked = cookieData.lastChecked > 0 
        ? new Date(cookieData.lastChecked) 
        : null;
      
      details.push({
        index: i,
        status: statusText,
        created_at: createdAt.toISOString(),
        created_at_formatted: createdAt.toLocaleString('zh-CN'),
        last_checked: lastChecked ? lastChecked.toISOString() : null,
        last_checked_formatted: lastChecked ? lastChecked.toLocaleString('zh-CN') : '未验证',
        cookie_preview: cookieInfo,
        cookie_length: cookieData.cookie.length,
        cookie_hash: hashCookie(cookieData.cookie)
      });
    }
    
    return {
      cookies: details,
      total: details.length
    };
  } catch (error) {
    console.error('获取 cookie 详细信息失败:', error.message);
    return {
      cookies: [],
      total: 0
    };
  }
}

/**
 * 从 cookie 字符串中提取关键信息
 */
function extractCookieInfo(cookieStr) {
  const info = {};
  const parts = cookieStr.split(';');
  
  for (const part of parts) {
    const trimmedPart = part.trim();
    if (!trimmedPart) continue;
    
    const equalIndex = trimmedPart.indexOf('=');
    if (equalIndex === -1) continue;
    
    const key = trimmedPart.substring(0, equalIndex);
    const value = trimmedPart.substring(equalIndex + 1);
    
    // 提取一些关键信息用于显示
    if (['data_ticket', 'slave_user', 'bizuin', 'slave_bizuin', 'xid', 'wxuin'].includes(key)) {
      info[key] = value;
    }
  }
  
  return info;
}

module.exports = {
  addCookie,
  getAllCookies,
  getValidCookie,
  cleanInvalidCookies,
  getCookiePoolStatus,
  getAllCookieDetails,
};
