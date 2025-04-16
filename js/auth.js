// 认证相关功能

// 保存登录状态的本地标记
let isUserLoggedIn = false;

// 初始化认证相关功能
document.addEventListener('DOMContentLoaded', function() {
  setupAuthDropdown();
  checkAndSetLoginStatus();
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
    // 移除URL中的参数但不刷新页面
    const newUrl = window.location.pathname + window.location.hash;
    history.replaceState({}, document.title, newUrl);
    isUserLoggedIn = true;
  } 
  // 方法2: 检查localStorage中保存的登录状态
  else if (localStorage.getItem('user_logged_in') === 'true') {
    isUserLoggedIn = true;
  }
  // 方法3: 检查当前页面路径，如果不是登录页且存在退出按钮，则可能已登录
  else if (window.location.pathname !== '/login') {
    // 额外的页面可访问性检查
    isUserLoggedIn = true;
    // 保存到localStorage以便后续访问
    localStorage.setItem('user_logged_in', 'true');
  }

  // 更新UI显示
  updateLoginUI();
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