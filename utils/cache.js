const { Redis } = require('@upstash/redis');

let redis = null;

/**
 * 初始化 Redis 连接
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
      console.log('✅ Redis 缓存已启用');
    } catch (error) {
      console.error('❌ Redis 初始化失败:', error.message);
      redis = null;
    }
  } else {
    console.log('⚠️  未配置 Redis 环境变量，缓存功能已禁用');
  }
  
  return redis;
}

/**
 * 获取公众号信息缓存
 */
async function getGzhInfo(fakeid) {
  const client = initRedis();
  if (!client) return null;
  
  try {
    const key = `gzh:info:${fakeid}`;
    const data = await client.get(key);
    return data ? JSON.parse(data) : null;
  } catch (error) {
    console.error('获取公众号信息缓存失败:', error.message);
    return null;
  }
}

/**
 * 设置公众号信息缓存
 */
async function setGzhInfo(fakeid, info) {
  const client = initRedis();
  if (!client) return;
  
  try {
    const key = `gzh:info:${fakeid}`;
    const value = JSON.stringify(info);
    // 缓存 24 小时
    await client.set(key, value, { ex: 24 * 60 * 60 });
  } catch (error) {
    console.error('设置公众号信息缓存失败:', error.message);
  }
}

/**
 * 获取粉丝数缓存
 */
async function getFansCount(fakeid) {
  const client = initRedis();
  if (!client) return null;
  
  try {
    const key = `gzh:fans:${fakeid}`;
    const data = await client.get(key);
    return data !== null ? parseInt(data, 10) : null;
  } catch (error) {
    console.error('获取粉丝数缓存失败:', error.message);
    return null;
  }
}

/**
 * 设置粉丝数缓存
 */
async function setFansCount(fakeid, count) {
  const client = initRedis();
  if (!client) return;
  
  try {
    const key = `gzh:fans:${fakeid}`;
    // 缓存 2 小时
    await client.set(key, count.toString(), { ex: 2 * 60 * 60 });
  } catch (error) {
    console.error('设置粉丝数缓存失败:', error.message);
  }
}

/**
 * 获取 Token 缓存
 */
async function getToken() {
  const client = initRedis();
  if (!client) return null;
  
  try {
    const key = `wx:token`;
    const data = await client.get(key);
    return data ? data : null;
  } catch (error) {
    console.error('获取 Token 缓存失败:', error.message);
    return null;
  }
}

/**
 * 设置 Token 缓存
 */
async function setToken(token) {
  const client = initRedis();
  if (!client) return;
  
  try {
    const key = `wx:token`;
    const value = token;
    // 缓存 30 天（token 通常有效期较长）
    await client.set(key, value, { ex: 30 * 24 * 60 * 60 });
  } catch (error) {
    console.error('设置 Token 缓存失败:', error.message);
  }
}

/**
 * 获取 Fingerprint 缓存
 */
async function getFingerprint() {
  const client = initRedis();
  if (!client) return null;
  
  try {
    const key = `wx:fingerprint`;
    const data = await client.get(key);
    return data ? data : null;
  } catch (error) {
    console.error('获取 Fingerprint 缓存失败:', error.message);
    return null;
  }
}

/**
 * 设置 Fingerprint 缓存
 */
async function setFingerprint(fingerprint) {
  const client = initRedis();
  if (!client) return;
  
  try {
    const key = `wx:fingerprint`;
    const value = fingerprint;
    // 缓存 30 天
    await client.set(key, value, { ex: 30 * 24 * 60 * 60 });
  } catch (error) {
    console.error('设置 Fingerprint 缓存失败:', error.message);
  }
}

/**
 * 获取所有认证信息（Token 和 Fingerprint）
 */
async function getAuthInfo() {
  const client = initRedis();
  if (!client) return null;
  
  try {
    const token = await getToken();
    const fingerprint = await getFingerprint();
    
    if (token && fingerprint) {
      return { token, fingerprint };
    }
    
    return null;
  } catch (error) {
    console.error('获取认证信息缓存失败:', error.message);
    return null;
  }
}

/**
 * 设置所有认证信息（Token 和 Fingerprint）
 */
async function setAuthInfo(token, fingerprint) {
  const client = initRedis();
  if (!client) return;
  
  try {
    await setToken(token);
    await setFingerprint(fingerprint);
    console.log('✅ Token 和 Fingerprint 已缓存');
  } catch (error) {
    console.error('设置认证信息缓存失败:', error.message);
  }
}

/**
 * 清除指定 fakeid 的所有缓存
 */
async function clearGzhCache(fakeid) {
  const client = initRedis();
  if (!client) return;
  
  try {
    const keys = [
      `gzh:info:${fakeid}`,
      `gzh:fans:${fakeid}`,
    ];
    await client.del(...keys);
  } catch (error) {
    console.error('清除缓存失败:', error.message);
  }
}

module.exports = {
  initRedis,
  getGzhInfo,
  setGzhInfo,
  getFansCount,
  setFansCount,
  clearGzhCache,
  getToken,
  setToken,
  getFingerprint,
  setFingerprint,
  getAuthInfo,
  setAuthInfo,
};
