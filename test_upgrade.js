/**
 * API 升级功能测试脚本
 * 用于测试缓存和 Cookie 管理功能
 */

const axios = require('axios');

const API_BASE_URL = 'http://localhost:3000';

// 测试配置（从 curl 命令提取的最新信息）
const testConfig = {
  account_name: '刘坏坏',
  token: '1981284630',
  cookie: 'ua_id=ee1ejnK0PjhugA8rAAAAAGWRrFaWtmmwECTVlCBAx70=; wxuin=58724258977014; mm_lang=zh_CN; RK=GDVFseZ+Fx; ptcz=29a91478aac149bfe498282f3e7197c6afb43529f64ee31a59ca23cf9b5d975b; personAgree_3869765355=true; _ga=GA1.1.60873631.1761889148; _qimei_uuid42=19a1f101e2810048aa61dfac3184d3a5608fa27d57; _qimei_fingerprint=524d0cc475f1645c22acfa4b26e407be; _qimei_i_3=6fd951d6c60b04dcc792f666528274e1f1e9a6a0105a0bd4b18b280d239b756b346b31973989e2baa8a9; _qimei_h38=a7bcd07faa61dfac3184d3a503000001d19a1f; _ga_PF3XX5J8LE=GS2.1.s1761899423$o2$g1$t1761899579$j59$l0$h0; _qimei_i_1=5ddc2ed39208038fc190a8610a8272b4a1bff7f2135307d6b7de2d582593206c616336c13980b3dd80b0d9da; pgv_pvid=4443021082; ts_uid=9935166680; pac_uid=0_GG8xw25NBX3ra; omgid=0_GG8xw25NBX3ra; _qimei_q36=; ptui_loginuin=1062771013; rand_info=CAESICpkffSg7VWtTN8C3wumGUGTUqu5QnEBWA4H3i9/r3tQ; slave_bizuin=3869765355; data_bizuin=3869765355; bizuin=3869765355; data_ticket=zCBm6EMlZiRJb5tbgq6JcEjV/kH+ZkQjKHebGEkQMX++eAEs3BvCbAwTYMPCV0K7; slave_sid=UEpfVTBPNWVNU01KajdkaHprZFF2OF9WUUQ2ZTlMQm4wa25VTkp2cENCNGdVdWp3RTQ4SFA2UnZ5Uk85NURLZ3J2dzVmcTJjVXBOWXN6UjdFdDI0WEV6V0Q2QVBHMU9hZ2ZIbE03ZzRKam02N0dkN2V1VksweGg4MmJNSDVrcFNPVUZXdk5FZnhHaHYwelU2; slave_user=gh_d1243b7c7b11; xid=e87041605bfb841a6bf7c5ad7398fe53; poc_sid=HKF8a2mj9aov7QxoNHmgT0U5HYL7kI6DCL1oVvN9; _clck=3869765355|1|g2u|0; cert=MFFUZhXWX0tRu1hOpgOxalUR8T19QVjJ; fs_uid=#o-1C2DZG-na1#3e610228-98ff-4758-b62c-ca3dac263fb0:dc416bbd-b3f0-4baa-aadd-9c96202b024e:1768809235916::1#/1800345237; __wx_phantom_mark__=9WeM2W7JV5; _clsk=17ggpz|1768813314984|4|1|mp.weixin.qq.com/weheat-agent/payload/record',
  fingerprint: '3fec25255d22fd0f735f8ccec90846da',
};

/**
 * 测试 1: 粉丝查询（带缓存）
 */
async function testFansQuery() {
  console.log('\n=== 测试 1: 粉丝查询 ===');
  
  try {
    const response = await axios.post(`${API_BASE_URL}/api/fans-query`, {
      account_name: testConfig.account_name,
      token: testConfig.token,
      cookie: testConfig.cookie,
      fingerprint: testConfig.fingerprint,
    });
    
    console.log('✅ 查询成功');
    console.log('响应数据:', JSON.stringify(response.data, null, 2));
    return true;
  } catch (error) {
    console.error('❌ 查询失败:', error.message);
    if (error.response) {
      console.error('错误详情:', JSON.stringify(error.response.data, null, 2));
    }
    return false;
  }
}

/**
 * 测试 2: 第二次查询（应该使用缓存）
 */
async function testCachedQuery() {
  console.log('\n=== 测试 2: 缓存查询 ===');
  
  try {
    const response = await axios.post(`${API_BASE_URL}/api/fans-query`, {
      account_name: testConfig.account_name,
      token: testConfig.token,
      cookie: testConfig.cookie,
      fingerprint: testConfig.fingerprint,
    });
    
    console.log('✅ 缓存查询成功');
    console.log('响应数据:', JSON.stringify(response.data, null, 2));
    console.log('提示: 检查控制台日志，应该显示 "📦 使用缓存的粉丝数"');
    return true;
  } catch (error) {
    console.error('❌ 缓存查询失败:', error.message);
    return false;
  }
}

/**
 * 测试 3: Cookie 池状态查询
 */
async function testCookieStatus() {
  console.log('\n=== 测试 3: Cookie 池状态 ===');
  
  try {
    const response = await axios.get(`${API_BASE_URL}/api/cookie-status`);
    
    console.log('✅ 获取 Cookie 池状态成功');
    console.log('Cookie 池状态:', JSON.stringify(response.data.data, null, 2));
    return true;
  } catch (error) {
    console.error('❌ 获取 Cookie 池状态失败:', error.message);
    return false;
  }
}

/**
 * 测试 4: 查询 Cookie 详细信息
 */
async function testCookieDetails() {
  console.log('\n=== 测试 4: Cookie 详细信息 ===');
  
  try {
    const response = await axios.get(`${API_BASE_URL}/api/cookie-details`);
    
    console.log('✅ 获取 Cookie 详细信息成功');
    console.log('Cookie 详细信息:', JSON.stringify(response.data.data, null, 2));
    return true;
  } catch (error) {
    console.error('❌ 获取 Cookie 详细信息失败:', error.message);
    return false;
  }
}

/**
 * 测试 5: 清理无效 Cookie
 */
async function testCleanCookies() {
  console.log('\n=== 测试 5: 清理无效 Cookie ===');
  
  try {
    const response = await axios.post(`${API_BASE_URL}/api/clean-cookies`);
    
    console.log('✅ 清理 Cookie 成功');
    console.log('清理数量:', response.data.data.cleaned);
    return true;
  } catch (error) {
    console.error('❌ 清理 Cookie 失败:', error.message);
    return false;
  }
}

/**
 * 运行所有测试
 */
async function runAllTests() {
  console.log('🚀 开始测试 API 升级功能...');
  console.log('⚠️  请确保服务器已启动 (npm start)');
  console.log('⚠️  请确保已配置正确的 Upstash Redis 环境变量');
  
  const results = {
    fansQuery: false,
    cachedQuery: false,
    cookieStatus: false,
    cookieDetails: false,
    cleanCookies: false,
  };
  
  // 依次执行测试
  results.fansQuery = await testFansQuery();
  results.cachedQuery = await testCachedQuery();
  results.cookieStatus = await testCookieStatus();
  results.cookieDetails = await testCookieDetails();
  results.cleanCookies = await testCleanCookies();
  
  // 输出测试结果
  console.log('\n=== 测试结果汇总 ===');
  console.log(`粉丝查询: ${results.fansQuery ? '✅ 通过' : '❌ 失败'}`);
  console.log(`缓存查询: ${results.cachedQuery ? '✅ 通过' : '❌ 失败'}`);
  console.log(`Cookie 状态: ${results.cookieStatus ? '✅ 通过' : '❌ 失败'}`);
  console.log(`Cookie 详细信息: ${results.cookieDetails ? '✅ 通过' : '❌ 失败'}`);
  console.log(`清理 Cookie: ${results.cleanCookies ? '✅ 通过' : '❌ 失败'}`);
  
  const passCount = Object.values(results).filter(r => r).length;
  const totalCount = Object.keys(results).length;
  
  console.log(`\n总计: ${passCount}/${totalCount} 测试通过`);
  
  if (passCount === totalCount) {
    console.log('🎉 所有测试通过！');
  } else {
    console.log('⚠️  部分测试失败，请检查错误信息');
  }
}

// 运行测试
runAllTests().catch(console.error);
