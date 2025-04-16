FROM node:18-alpine AS build

# 设置工作目录
WORKDIR /app

# 复制package.json和package-lock.json
COPY package*.json ./

# 安装依赖
RUN npm ci --only=production || npm install --only=production

# 复制所有源代码
COPY . .

# 第二阶段：运行阶段
FROM nginx:alpine

# 安装Node.js和必要工具
RUN apk add --no-cache nodejs npm supervisor curl && \
    mkdir -p /var/log/node /var/log/nginx /var/log/supervisor

# 设置工作目录
WORKDIR /app

# 创建数据和配置目录
RUN mkdir -p /app/data /app/config

# 复制Node.js依赖和源代码
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/server.js ./
COPY --from=build /app/package.json ./
COPY --from=build /app/docker ./docker
COPY --from=build /app/login.html ./
COPY --from=build /app/functions ./functions

# 复制静态文件到Nginx服务目录
COPY --from=build /app/*.html /usr/share/nginx/html/
COPY --from=build /app/css /usr/share/nginx/html/css
COPY --from=build /app/js /usr/share/nginx/html/js
COPY --from=build /app/*.txt /usr/share/nginx/html/
COPY --from=build /app/*.xml /usr/share/nginx/html/

# 配置Nginx
COPY docker/nginx.conf /etc/nginx/conf.d/default.conf

# 设置启动脚本权限
COPY docker/start.sh /app/
RUN chmod +x /app/start.sh

# 配置supervisord
COPY docker/supervisord.conf /app/docker/supervisord.conf

# 暴露端口 (Nginx和Node.js)
EXPOSE 80 3000

# 环境变量
ENV ACCESS_PASSWORD=""
ENV SESSION_SECRET=libretv-secret-key
ENV PORT=3000

# 启动命令
CMD ["/app/start.sh"]