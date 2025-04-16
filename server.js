require('dotenv').config();
const express = require('express');
const session = require('express-session');
const bodyParser = require('body-parser');
const bcrypt = require('bcrypt');
const cookieParser = require('cookie-parser');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;

// 读取环境变量
const ACCESS_PASSWORD = process.env.ACCESS_PASSWORD || '';
// 判断是否开启密码保护 - 有密码时启用保护，无密码时禁用保护
const REQUIRE_AUTH = ACCESS_PASSWORD.trim() !== '';

// 生成密码哈希（仅在需要密码保护时执行）
let passwordHash;
async function generatePasswordHash() {
  // 如果不需要密码认证，则跳过哈希生成
  if (!REQUIRE_AUTH) {
    console.log('密码保护已禁用');
    return;
  }

  try {
    passwordHash = await bcrypt.hash(ACCESS_PASSWORD, 10);
    console.log('密码哈希生成成功');
  } catch (error) {
    console.error('生成密码哈希时出错:', error);
    // 出错时使用默认哈希 (admin123)
    passwordHash = '$2b$10$rBmR.Mq1vNdjcQeZlDC4uOsqUz5ALJhZZlPiY0G7OzP4L.Bdjmfou';
  }
}
generatePasswordHash();

// 配置中间件
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(cookieParser());
app.use(session({
  secret: process.env.SESSION_SECRET || 'libretv-secret-key',
  resave: false,
  saveUninitialized: true,
  cookie: { secure: process.env.NODE_ENV === 'production' }
}));

// 静态文件服务
app.use(express.static('.'));

// 身份验证中间件
const authMiddleware = (req, res, next) => {
  // 如果禁用密码验证，直接通过
  if (!REQUIRE_AUTH) {
    return next();
  }
  
  // 否则检查是否已登录
  if (req.session.isAuthenticated) {
    return next();
  }
  
  // 重定向到登录页
  res.redirect('/login');
};

// 登录页面路由
app.get('/login', (req, res) => {
  // 如果已禁用密码，重定向到首页
  if (!REQUIRE_AUTH) {
    return res.redirect('/');
  }
  
  // 如果已登录，重定向到首页
  if (req.session.isAuthenticated) {
    return res.redirect('/');
  }
  
  res.sendFile(path.join(__dirname, 'login.html'));
});

// 登录接口
app.post('/api/login', async (req, res) => {
  if (!REQUIRE_AUTH) {
    return res.status(200).json({ success: true, message: '密码验证已禁用' });
  }

  const { password } = req.body;
  
  // 验证密码
  try {
    const isValidPassword = await bcrypt.compare(password, passwordHash);
    
    if (isValidPassword) {
      req.session.isAuthenticated = true;
      return res.status(200).json({ success: true, message: '登录成功' });
    } else {
      return res.status(401).json({ success: false, message: '密码错误' });
    }
  } catch (error) {
    console.error('登录验证错误:', error);
    return res.status(500).json({ success: false, message: '服务器错误' });
  }
});

// 登出接口
app.get('/api/logout', (req, res) => {
  req.session.destroy();
  res.clearCookie('connect.sid');
  res.redirect('/login');
});

// 保护主页
app.get('/', authMiddleware, (req, res, next) => {
  next(); // 通过验证后，继续处理原始请求
});

// 保护其他页面
app.get('/watch.html', authMiddleware, (req, res, next) => {
  next();
});

app.get('/player.html', authMiddleware, (req, res, next) => {
  next();
});

// 启动服务器
app.listen(PORT, () => {
  console.log(`服务器已在端口 ${PORT} 上启动`);
  console.log(`密码保护状态: ${REQUIRE_AUTH ? '已启用' : '已禁用'}`);
  if (REQUIRE_AUTH) {
    console.log('访问密码已设置');
  }
}); 