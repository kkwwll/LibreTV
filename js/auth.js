// 认证相关功能

// 保存登录状态的本地标记
let isUserLoggedIn = false;

// 生成一个每次部署都不同的ID
const DEPLOYMENT_ID = 'v1.0.1_' + new Date().toISOString() + '_' + Math.random().toString(36).substring(2, 10);
console.log('当前部署ID:', DEPLOYMENT_ID);

// 立即检查部署状态（不等待DOMContentLoaded）
(function immediateCheck() {
  const savedDeploymentId = localStorage.getItem('deployment_id');
  console.log('保存的部署ID:', savedDeploymentId);
  
  // 如果部署ID不匹配或不存在，则可能是新部署
  if (savedDeploymentId !== DEPLOYMENT_ID) {
    console.log('检测到新的部署版本，清除登录状态');
    
    // 清除登录状态
    localStorage.removeItem('user_logged_in');
    localStorage.removeItem('login_timestamp');
    isUserLoggedIn = false;
    
    // 保存新的部署ID
    localStorage.setItem('deployment_id', DEPLOYMENT_ID);
    
    // 如果之前有登录状态，则刷新页面以重新验证
    if (savedDeploymentId && localStorage.getItem('user_logged_in') === 'true') {
      console.log('检测到旧登录状态，将刷新页面');
      window.location.href = '/login';
    }
  } else {
    console.log('部署ID匹配，无需重新登录');
  }
})();

// 初始化认证相关功能
document.addEventListener('DOMContentLoaded', function() {
  setupAuthDropdown();
  checkAndSetLoginStatus();
  
  // 定期验证登录状态
  setInterval(validateAuthStatus, 10000); // 每10秒检查一次
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
  console.log('检查并设置登录状态');
  
  // 方法1: 检查当前URL是否包含登录成功参数
  const urlParams = new URLSearchParams(window.location.search);
  if (urlParams.has('login_success')) {
    console.log('检测到登录成功参数');
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
    console.log('从localStorage检测到登录状态');
    isUserLoggedIn = true;
  } else {
    console.log('没有检测到登录状态');
  }

  // 更新UI显示
  updateLoginUI();
  console.log('当前登录状态:', isLoggedIn());
}

// 验证登录状态的有效性
async function validateAuthStatus() {
  // 如果没有登录状态，无需验证
  if (!isLoggedIn()) return;
  
  console.log('验证登录状态');
  
  try {
    // 尝试请求一个特殊的验证路径，这个路径应该只有已登录用户可以访问
    const timestamp = Date.now();
    const response = await fetch('/api/validate-auth?t=' + timestamp, {
      method: 'GET',
      cache: 'no-store',
      credentials: 'include'
    });
    
    console.log('验证响应状态:', response.status, '响应URL:', response.url);
    
    // 如果状态码是401或403或404，则尝试更全面的检查
    if (response.status === 401 || response.status === 403 || response.status === 404) {
      console.log('收到可能的未授权状态码，进行二次检查');
      checkAuthWithFullPage();
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
    // 出错时尝试更全面的检查
    checkAuthWithFullPage();
  }
}

// 通过完整页面请求检查身份验证状态
function checkAuthWithFullPage() {
  console.log('尝试通过完整页面请求检查身份验证');
  
  const iframe = document.createElement('iframe');
  iframe.style.display = 'none';
  iframe.src = '/?auth_check=' + Date.now();
  
  iframe.onload = function() {
    try {
      // 尝试检查iframe是否被重定向到登录页
      const currentUrl = iframe.contentWindow.location.href;
      console.log('iframe加载完成，URL:', currentUrl);
      
      if (currentUrl.includes('/login')) {
        console.log('iframe被重定向到登录页，登录已失效');
        handleLogout();
        window.location.href = '/login';
      }
      
      // 清理iframe
      setTimeout(function() {
        document.body.removeChild(iframe);
      }, 100);
    } catch (e) {
      console.error('检查iframe URL时出错:', e);
      document.body.removeChild(iframe);
    }
  };
  
  document.body.appendChild(iframe);
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
      console.log('显示退出按钮');
    } else {
      logoutButton.classList.add('hidden');
      console.log('隐藏退出按钮');
    }
  } else {
    console.log('未找到退出按钮元素');
  }
}

// 处理退出登录
function handleLogout() {
  console.log('执行登出操作');
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