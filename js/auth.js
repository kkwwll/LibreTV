// 认证相关功能

// 保存登录状态的本地标记
let isUserLoggedIn = false;

// 初始化认证相关功能
document.addEventListener('DOMContentLoaded', function() {
  setupAuthDropdown();
  checkAndSetLoginStatus();
  
  // 定期验证登录状态
  setInterval(validateAuthStatus, 60000); // 每分钟检查一次
});

// 初始化认证下拉菜单功能
function setupAuthDropdown() {
  // 点击页面其他地方隐藏下拉菜单
  document.addEventListener('click', function() {
    const dropdown = document.getElementById('authDropdown');
    if (dropdown) {
      dropdown.classList.remove('show');
    }
  });
}

// 切换认证下拉菜单显示/隐藏
function toggleAuthDropdown(e) {
  // 阻止事件冒泡，防止触发document的点击事件
  e && e.stopPropagation();
  const dropdown = document.getElementById('authDropdown');
  if (dropdown) {
    dropdown.classList.toggle('show');
  }
}

// 主要的登录状态检测函数
function checkAndSetLoginStatus() {
  // 方法1: 检查当前URL是否包含登录成功参数
  const urlParams = new URLSearchParams(window.location.search);
  if (urlParams.has('login_success')) {
    // 登录成功，保存到localStorage
    localStorage.setItem('user_logged_in', 'true');
    // 记录登录时间戳，用于验证
    localStorage.setItem('login_timestamp', Date.now().toString());
    // 移除URL中的参数但不刷新页面
    const newUrl = window.location.pathname + window.location.hash;
    history.replaceState({}, document.title, newUrl);
    isUserLoggedIn = true;
  } 
  // 方法2: 检查localStorage中保存的登录状态
  else if (localStorage.getItem('user_logged_in') === 'true') {
    isUserLoggedIn = true;
  }
  // 方法3已移除：不再简单地根据URL路径判断登录状态

  // 更新UI显示
  updateLoginUI();
}

// 验证登录状态的有效性
async function validateAuthStatus() {
  // 如果没有登录状态，无需验证
  if (!isLoggedIn()) return;
  
  try {
    // 尝试访问根页面，如果被重定向到登录页，说明登录已失效
    const response = await fetch('/', {
      method: 'HEAD',
      redirect: 'manual',
      cache: 'no-store'
    });
    
    // 如果被重定向到登录页面，清除登录状态
    if (response.type === 'opaqueredirect' || response.redirected) {
      // 请求被重定向，可能是登录已失效
      // 尝试一次完整的页面请求来确认
      checkFullPageAuth();
    }
  } catch (error) {
    console.error('验证登录状态时出错:', error);
  }
}

// 通过XHR请求验证当前页面是否需要重新登录
function checkFullPageAuth() {
  const xhr = new XMLHttpRequest();
  xhr.open('GET', '/', true);
  xhr.onreadystatechange = function() {
    if (xhr.readyState === 4) {
      // 如果响应URL是登录页，说明登录已失效
      if (xhr.responseURL && xhr.responseURL.includes('/login')) {
        console.log('登录已失效，需要重新登录');
        handleLogout();
        // 页面刷新，会自动跳转到登录页
        window.location.reload();
      }
    }
  };
  xhr.send();
}

// 检查是否已登录
function isLoggedIn() {
  return isUserLoggedIn || localStorage.getItem('user_logged_in') === 'true';
}

// 检查登录状态并更新UI
function checkLoginStatus() {
  return isLoggedIn();
}

// 更新登录状态相关的UI
function updateLoginUI() {
  const logoutButton = document.getElementById('logoutButton');
  
  if (logoutButton) {
    if (isLoggedIn()) {
      logoutButton.classList.remove('hidden');
    } else {
      logoutButton.classList.add('hidden');
    }
  }
}

// 处理退出登录
function handleLogout() {
  // 清除本地存储的登录状态
  localStorage.removeItem('user_logged_in');
  localStorage.removeItem('login_timestamp');
  isUserLoggedIn = false;
}

// 跳转到登录页面
function redirectToLogin() {
  // 清除登录状态
  handleLogout();
  window.location.href = '/login';
}

// 导出函数
window.isLoggedIn = isLoggedIn;
window.checkLoginStatus = checkLoginStatus;
window.redirectToLogin = redirectToLogin;
window.toggleAuthDropdown = toggleAuthDropdown;
window.handleLogout = handleLogout; 