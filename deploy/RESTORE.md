# 小杨 PRO 服务器恢复手册

本手册用于把整套系统从零恢复到一台全新的 Debian 服务器。按顺序执行即可;即便由不熟悉本项目的人或 AI 照做,也能还原。

## 准备
- 一台干净的 Debian 12 服务器(root)
- 本仓库 git 地址(见 deploy/ENV-SNAPSHOT.txt 里的 git remote 一行)
- 密钥包 yang-secrets.tar.gz:内含 backend/.env 与 backend/app.db。迁移前务必从旧服务器的 ~ 目录取走另存。这两样不在 git 里,丢了等于登录配置和脚本数据全没。

## 步骤
1. 装依赖:
   apt update && apt install -y git docker.io nginx python3 python3-venv python3-pip curl
   curl -fsSL https://deb.nodesource.com/setup_20.x | bash - && apt install -y nodejs

2. 拉代码(用 ENV-SNAPSHOT.txt 里的 git 地址):
   cd ~ && git clone 仓库地址 python-learn-platform && cd python-learn-platform

3. 还原密钥(把 yang-secrets.tar.gz 放到 ~ 后):
   tar xzf ~/yang-secrets.tar.gz -C backend
   确认 backend/.env 和 backend/app.db 都在。

4. 构建执行镜像(必须,否则代码跑不了):
   docker build -t pysandbox:latest sandbox/

5. 后端:
   cd backend && python3 -m venv venv && . venv/bin/activate && pip install -r requirements.txt && cd ..

6. 前端:
   cd frontend && npm install && npm run build && cd ..

7. 注册系统服务(用快照):
   cp deploy/learn.service /etc/systemd/system/learn.service
   核对 learn.service 里的 WorkingDirectory 指向 backend 目录、ExecStart 用 backend/venv 的 uvicorn。
   systemctl daemon-reload && systemctl enable --now learn

8. Nginx 反代(用快照):
   cp deploy/nginx.conf /etc/nginx/sites-available/lune
   ln -sf /etc/nginx/sites-available/lune /etc/nginx/sites-enabled/lune
   nginx -t && systemctl reload nginx

9. DNS:在 Cloudflare 把 lune.yang-888.com 解析到新服务器 IP。Google OAuth 绑的是域名不是 IP,只要域名不变就不用动 OAuth。

10. 验证:开 https://lune.yang-888.com,Google 登录,跑一段 print、一段 input,再 pip install 一个库确认装库与持久化正常。

## 关键事实(排错必看)
- 后端必须从 backend 目录启动,否则读不到 .env,会导致 Google 登录失效(google_login false)
- 持久工作区在 /root/workspaces/main,pip 装到它的 .pylibs 子目录,PYTHONPATH 已指向该处
- 不在 git 的只有两样:backend/.env 与 backend/app.db
- 执行依赖 Docker 与 pysandbox 镜像;镜像缺失则工作台不可用,其余功能不受影响
