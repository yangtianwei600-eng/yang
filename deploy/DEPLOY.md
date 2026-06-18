# 部署 / 迁移

## 新服务器一键部署（Debian + root）

```bash
git clone <仓库地址> /root/python-learn-platform
cd /root/python-learn-platform
DOMAIN=你的域名 bash deploy/setup.sh
```

脚本依次完成:安装依赖(nginx / docker / node / python venv)→ 装后端依赖 → 构建前端 → 构建沙箱镜像 → 配置 Nginx(自签证书)→ 配置 systemd 开机自启。

## git 不包含、需手动处理的三件

1. **密钥** —— 编辑 `backend/.env`(谷歌 OAuth、邮箱白名单等),改完 `systemctl restart learn`。模板见 `.env.example`。
2. **数据** —— 把旧服务器的 `backend/app.db` 拷到新机器同一路径;脚本和学习进度都在这个文件里,不拷就是空库。
3. **域名解析** —— 把 Cloudflare 的 A 记录指向新服务器 IP。域名不变的话,谷歌登录无需任何改动(OAuth 认域名不认 IP)。

## 日常命令

| 操作 | 命令 |
| --- | --- |
| 查看后端状态 | `systemctl status learn` |
| 实时日志 | `journalctl -u learn -f` |
| 重启后端 | `systemctl restart learn` |
| 拉取最新代码 | `git pull` |
| 前端有改动 | `cd frontend && npm run build` |
| 后端有改动 | `systemctl restart learn` |

## 说明

- 后端监听 `127.0.0.1:8000`,仅本机可达;对外由 Nginx 反代,经 Cloudflare(Full 模式)提供 HTTPS。
- systemd 单元把工作目录固定在 `backend/`,确保 `.env` 与 SQLite 路径正确,并在崩溃后自动重启。
- 代码执行依赖 Docker 与 `pysandbox:latest` 镜像;镜像由 `sandbox/Dockerfile` 构建。
