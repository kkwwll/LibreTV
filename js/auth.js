// 认证相关功能

// 保存登录状态的本地标记
let isUserLoggedIn = false;

// 生成一个唯一的部署ID并检查是否匹配
const DEPLOYMENT_ID = 'v1.0.0_' + new Date().toISOString().split('T')[0];

// 初始化认证相关功能
document.addEventListener('DOMContentLoaded', function() {
  setupAuthDropdown();
  checkDeploymentChange();
  checkAndSetLoginStatus();
  
  // 定期验证登录状态
  setInterval(validateAuthStatus, 30000); // 每30秒检查一次
});

// 检查部署是否已更新
function checkDeploymentChange() {
  const savedDeploymentId = localStorage.getItem('deployment_id');
  
  // 如果部署ID不匹配或不存在，则可能是新部署
  if (savedDeploymentId !== DEPLOYMENT_ID) {
    console.log('检测到新的部署版本，清除登录状态');
    
    // 清除登录状态
    handleLogout();
    
    // 保存新的部署ID
    localStorage.setItem('deployment_id', DEPLOYMENT_ID);
    
    // 如果之前有登录状态，则刷新页面以重新验证
    if (savedDeploymentId) {
      window.location.reload();
    }
  }
}

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

  // 更新UI显示
  updateLoginUI();
}

// 验证登录状态的有效性
async function validateAuthStatus() {
  // 如果没有登录状态，无需验证
  if (!isLoggedIn()) return;
  
  try {
    // 尝试请求一个特殊的验证路径，这个路径应该只有已登录用户可以访问
    // 例如尝试加载一个受保护的资源或API
    // 这里使用一个很可能不存在的路径，以便在响应时查看是返回404(已登录)还是被重定向到登录页
    const response = await fetch('/api/validate-auth?t=' + Date.now(), {
      method: 'HEAD',
      cache: 'no-store',
      credentials: 'include'
    });
    
    // 如果状态码是401或403，则认为登录已失效
    if (response.status === 401 || response.status === 403) {
      console.log('登录已失效，需要重新登录');
      handleLogout();
      window.location.href = '/login';
      return;
    }
    
    // 如果服务器返回路径中包含login，也认为登录已失效
    if (response.url && response.url.includes('/login')) {
      console.log('登录已失效，被重定向到登录页');
      handleLogout();
      window.location.href = '/login';
    }
  } catch (error) {
    console.error('验证登录状态时出错:', error);
    // 出错时不处理，保持当前状态
  }
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