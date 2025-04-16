/**
 * LibreTV 认证中间件 - Cloudflare Pages Functions版本
 * 
 * 此文件是项目在Cloudflare Pages部署时的认证中间件
 * 
 * 部署指南:
 * 1. 将整个项目上传到GitHub仓库
 * 2. 在Cloudflare Dashboard中创建Pages项目并关联GitHub仓库
 * 3. 在环境变量中设置ACCESS_PASSWORD（留空则禁用密码保护）
 * 4. 部署完成后，Pages Functions将自动处理密码保护功能
 * 
 * 无需额外配置，整个项目(前端+认证服务)将一起部署在Cloudflare Pages上
 */

// Cloudflare Pages 中间件，用于实现密码保护
export async function onRequest(context) {
  const { request, env, next } = context;
  const url = new URL(request.url);
  
  // 读取访问密码配置（从环境变量获取）
  const accessPassword = env.ACCESS_PASSWORD || '';
  const requireAuth = accessPassword.trim() !== '';
  
  // 如果不需要密码保护，直接放行请求
  if (!requireAuth) {
    return next();
  }
  
  // 检查是否已登录（通过Cookie）
  const cookie = request.headers.get('Cookie') || '';
  const isAuthenticated = cookie.includes('auth=true');
  
  // 登录页面请求，始终允许访问
  if (url.pathname === '/login' || url.pathname === '/api/login') {
    // 处理登录API请求
    if (url.pathname === '/api/login' && request.method === 'POST') {
      try {
        // 获取请求体中的密码
        const requestData = await request.json();
        const { password } = requestData;
        
        // 验证密码
        if (password === accessPassword) {
          // 登录成功，设置Cookie并重定向到首页
          const response = new Response(JSON.stringify({ success: true, message: '登录成功' }), {
            status: 200,
            headers: {
              'Content-Type': 'application/json',
              'Set-Cookie': 'auth=true; Path=/; HttpOnly; SameSite=Strict; Max-Age=86400' // 1天有效期
            }
          });
          return response;
        } else {
          // 密码错误
          return new Response(JSON.stringify({ success: false, message: '密码错误' }), {
            status: 401,
            headers: { 'Content-Type': 'application/json' }
          });
        }
      } catch (error) {
        // 处理错误
        return new Response(JSON.stringify({ success: false, message: '服务器错误' }), {
          status: 500,
          headers: { 'Content-Type': 'application/json' }
        });
      }
    }
    return next();
  }
  
  // 登出API请求
  if (url.pathname === '/api/logout') {
    return new Response(null, {
      status: 302,
      headers: {
        'Location': '/login',
        'Set-Cookie': 'auth=; Path=/; HttpOnly; SameSite=Strict; Max-Age=0'
      }
    });
  }
  
  // 检查是否已登录，如果已登录则允许访问
  if (isAuthenticated) {
    return next();
  }
  
  // 未登录，重定向到登录页面
  return new Response(null, {
    status: 302,
    headers: { 'Location': '/login' }
  });
} 