#!/usr/bin/env bash
# 学练 · 一键部署 / 迁移脚本（Debian + root）
#
# 用法：
#   git clone <仓库地址> /root/python-learn-platform
#   cd /root/python-learn-platform
#   DOMAIN=你的域名 bash deploy/setup.sh
#
# 脚本不做的事（git 不含、需手动）：
#   1. backend/.env  —— 谷歌 OAuth / 白名单等密钥（脚本会从 .env.example 生成空模板）
#   2. backend/app.db —— 旧服务器的数据（脚本/进度），需自行拷贝
#   3. Cloudflare DNS —— A 记录指向本机 IP

set -e

ROOT=/root/python-learn-platform
DOMAIN="${DOMAIN:-your-domain.com}"

echo "[1/7] 安装系统依赖（nginx / docker / python / openssl）..."
apt-get update
apt-get install -y nginx docker.io python3-venv python3-pip curl openssl
systemctl enable --now docker

echo "[2/7] 安装 Node（缺失时装 20.x）..."
if ! command -v node >/dev/null 2>&1; then
  curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
  apt-get install -y nodejs
fi

echo "[3/7] 后端：创建 venv + 安装依赖..."
cd "$ROOT/backend"
python3 -m venv venv
./venv/bin/pip install -U pip
./venv/bin/pip install -r requirements.txt
if [ ! -f .env ]; then
  cp .env.example .env
  echo "    ⚠ 已生成空的 .env，记得填好谷歌 OAuth / 白名单后再 systemctl restart learn"
fi

echo "[4/7] 前端：安装依赖 + 构建..."
cd "$ROOT/frontend"
npm install
npm run build

echo "[5/7] 构建代码执行沙箱镜像（较慢）..."
cd "$ROOT/sandbox"
docker build -t pysandbox:latest .

echo "[6/7] 配置 Nginx（自签证书）..."
mkdir -p /etc/nginx/certs
if [ ! -f /etc/nginx/certs/self.crt ]; then
  openssl req -x509 -nodes -newkey rsa:2048 \
    -keyout /etc/nginx/certs/self.key -out /etc/nginx/certs/self.crt \
    -days 3650 -subj "/CN=$DOMAIN"
fi
sed "s/your-domain.com/$DOMAIN/g" "$ROOT/deploy/nginx.conf" > /etc/nginx/sites-available/learn
ln -sf /etc/nginx/sites-available/learn /etc/nginx/sites-enabled/learn
nginx -t && systemctl reload nginx

echo "[7/7] 配置后端开机自启（systemd）..."
cp "$ROOT/deploy/learn.service" /etc/systemd/system/learn.service
systemctl daemon-reload
systemctl enable learn
systemctl restart learn

echo ""
echo "✅ 部署完成。剩下三件手动："
echo "   1. 填密钥：编辑 $ROOT/backend/.env 后 → systemctl restart learn"
echo "   2. 迁数据：把旧服务器的 backend/app.db 拷到 $ROOT/backend/app.db"
echo "   3. 解析：Cloudflare A 记录指向本机 IP（域名不变则谷歌登录无需改）"
echo ""
echo "   查看后端：systemctl status learn    日志：journalctl -u learn -f"
