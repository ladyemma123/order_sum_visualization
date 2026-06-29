#!/bin/bash
# 自动化构建与启动脚本

echo "🚀 开始部署全栈看板项目..."

# 1. 停止并移除旧容器
echo "📦 正在清理旧容器..."
docker-compose down

# 2. 重新构建并后台启动容器
echo "🛠️ 正在使用 Docker 进行多阶段构建 (Vite + esbuild)..."
docker-compose up --build -d

echo "✅ Docker 容器启动成功！服务运行在 http://127.0.0.1:3000"
echo "📢 请记得将 Nginx 配置文件复制到 /etc/nginx/sites-enabled/ 并重启 Nginx。"
