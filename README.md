# 学练

移动端优先的 Python 练习平台。提交的代码在服务端 Docker 沙箱内真实执行,而非浏览器模拟——目标是随时随地写 Python、跑爬虫,拿到与本机一致的运行结果。

## 功能

- **代码工作台**:在线编辑器编写 Python,提交至服务端沙箱执行,输出以浮窗返回;脚本支持保存、编辑、删除。
- **课程与练习**:内置 Python 基础与爬虫两套课程,章节完成状态与学习进度持久化。
- **间隔重复**:基于 SM-2 算法调度复习,到期项自动进入复习队列。
- **鉴权**:Google OAuth 登录配合邮箱白名单,单用户自用,不开放注册。

界面为移动端优先,暖色调、磨砂层、抽屉式侧边导航,同时适配 iPad 与桌面。

## 架构

```
python-learn-platform/
├── backend/                     FastAPI 服务
│   ├── app/
│   │   ├── main.py              入口:挂载路由 + 托管前端构建产物
│   │   ├── config.py           环境配置(.env)
│   │   ├── database.py         SQLAlchemy 引擎与会话
│   │   ├── models.py           ORM 模型:用户 / 课程 / 章节 / 练习 / 进度 / 复习项 / 脚本
│   │   ├── schemas.py          Pydantic 请求与响应模型
│   │   ├── auth.py             Google OAuth 流程
│   │   ├── deps.py             鉴权依赖
│   │   ├── executor.py         Docker 沙箱执行器
│   │   ├── srs.py              SM-2 间隔重复
│   │   ├── activity.py         学习活跃度与连续打卡
│   │   ├── seed.py             初始课程数据
│   │   └── routers/            auth · content · progress · review · run · scripts
│   ├── requirements.txt
│   └── .env.example
├── frontend/                    React + Vite + TypeScript
│   └── src/
│       ├── components/          工作台 CodeLab、侧边栏、Markdown、练习卡片等
│       ├── views/              学习 / 章节 / 进度 / 复习
│       ├── hooks/              鉴权、响应式断点
│       ├── lib/                API 封装与工具函数
│       ├── types/             接口与运行结果类型
│       ├── App.tsx            布局外壳与视图切换
│       └── index.css          设计 token:色彩 / 字体 / 间距 / 圆角
└── sandbox/
    └── Dockerfile             执行镜像,预装 requests / bs4 / lxml / pandas / numpy / playwright 等
```

## 技术选型

- **前端** React + Vite + TypeScript + Tailwind,设计 token 收敛在 CSS 变量中统一主题。
- **后端** FastAPI + SQLite(SQLAlchemy)。单用户场景下 SQLite 足够,模型层与具体数据库解耦,后续可平滑迁移至 PostgreSQL。
- **执行** 每次运行启动一个一次性容器:只读文件系统、非 root、丢弃多余 capability、限制内存与进程数,保留网络以支持爬虫。
- **部署** 后端同源托管前端构建产物以规避 CORS;VPS 上经 Nginx 反向代理,Cloudflare 接入,全程 HTTPS。

## 运行

后端:

```bash
cd backend
python3 -m venv venv && source venv/bin/activate
pip install -r requirements.txt
cp .env.example .env              # 配置 Google OAuth、邮箱白名单等
uvicorn app.main:app --reload
```

前端:

```bash
cd frontend
npm install
npm run dev                       # 开发;生产环境用 npm run build,产物交由后端托管
```

部署须知:

- 代码执行依赖 Docker,需预先构建 `sandbox/` 下的镜像;缺少 Docker 时工作台不可用,其余功能不受影响。
- Google OAuth 要求 HTTPS 回调,登录链路须部署于 HTTPS 域名下方可打通。
- 密钥均置于 `backend/.env`(模板见 `.env.example`),不纳入版本控制。
