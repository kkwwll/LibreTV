#!/bin/sh

# 设置默认环境变量
export NODE_ENV="production"
export PORT=${PORT:-3000}
export SESSION_SECRET=${SESSION_SECRET:-libretv-secret-key}

# 确保日志目录存在
mkdir -p /var/log/nginx
mkdir -p /var/log/node
mkdir -p /var/log/supervisor

# 显示版本信息
echo "========================================="
echo "LibreTV 集成部署启动"
echo "Nginx版本: $(nginx -v 2>&1)"
echo "Node版本: $(node -v)"
echo "Node环境: $NODE_ENV"
echo "服务端口: $PORT"
echo "========================================="

# 启动supervisord (它会启动nginx和node.js服务)
exec /usr/bin/supervisord -c /app/docker/supervisord.conf 