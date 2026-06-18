# 学练

自己用的 Python 练习平台。核心就一件事:在手机上随手写 Python,点一下在服务器上真跑出来,顺便练爬虫。

平时想练手的时候手机上一直没个顺手的环境——在线 IDE 要么广告一堆,要么装不了库,干脆自己搭一个。代码在服务器的 Docker 沙箱里跑,requests、beautifulsoup、pandas、playwright 这些都预装好了,写完直接看结果。

## 它能干嘛

- **代码工作台**:写任意 Python,点运行,沙箱里执行,结果弹窗返回。脚本能存、能改、能删。
- **学习 + 练习**:内置 Python 基础和爬虫两套课程,看完标记完成、记进度。
- **复习**:SM-2 间隔重复,到点该复习的自动排出来。
- **登录**:谷歌 OAuth + 邮箱白名单,自用,不开放注册。

界面是照着平时用得最顺手的那几个 App 慢慢抠的——暖色调、磨砂、左滑侧边栏,手机优先,iPad 和桌面也都适配。

## 技术栈

- 前端:React + Vite + TypeScript + Tailwind
- 后端:FastAPI + SQLite(SQLAlchemy 写的,以后要多用户再换 PostgreSQL)
- 执行:Docker 沙箱,单独一个镜像预装常用库;容器只读文件系统、非 root、砍掉多余权限、限内存和进程数,但保留联网(爬虫得用)
- 部署:VPS + Nginx 反代 + Cloudflare,全程 HTTPS

后端顺手把前端打包后的静态文件一起托管了,同源,省得管 CORS。

## 跑起来

后端:

```bash
cd backend
python3 -m venv venv && source venv/bin/activate
pip install -r requirements.txt
cp .env.example .env        # 填自己的谷歌 OAuth、白名单邮箱
uvicorn app.main:app --reload
```

前端:

```bash
cd frontend
npm install
npm run dev                 # 开发；上线用 npm run build,交给后端托管
```

几个坑提前说:

- 工作台要能跑代码,得先装 Docker、把 sandbox/ 里的镜像构建出来。没 Docker 工作台用不了,别的功能不受影响。
- 谷歌登录要去 Google Cloud 建 OAuth 凭据,回调填自己的域名。谷歌强制 HTTPS,所以登录这块得部署到带 HTTPS 的域名上才能真正打通,本地 http 跑不通。
- 密钥都在 backend/.env,模板是 .env.example,不进仓库。

## 目录

```
backend/    FastAPI、数据模型、沙箱执行
frontend/   React 前端
sandbox/    代码执行用的 Docker 镜像
```
