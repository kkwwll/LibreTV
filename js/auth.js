// 认证相关功能

// 初始化认证相关功能
document.addEventListener('DOMContentLoaded', function() {
  setupAuthDropdown();
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

// 检查是否已登录
function isLoggedIn() {
  return document.cookie.includes('auth=true');
}

// 跳转到登录页面
function redirectToLogin() {
  window.location.href = '/login';
}

// 导出函数
window.isLoggedIn = isLoggedIn;
window.redirectToLogin = redirectToLogin;
window.toggleAuthDropdown = toggleAuthDropdown; 