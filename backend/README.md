# 后端 · Python 学习平台

FastAPI + SQLite。提供谷歌登录（白名单）、课程内容、学习进度、间隔重复复习的 API。

## 为什么用 SQLite 不用 PostgreSQL

这是单用户应用（白名单只有你一个邮箱）。SQLite 单文件、零配置、备份就是复制一个文件，对单用户完全够用，不是妥协。代码用 SQLAlchemy 写，以后真要多用户，把 `DATABASE_URL` 换成 PostgreSQL 连接串即可，不用改业务代码。

## 本地 / VPS 安装运行

```bash
cd backend

# 1. 建虚拟环境（隔离依赖，推荐）
python3 -m venv venv
source venv/bin/activate

# 2. 装依赖
pip install -r requirements.txt

# 3. 配置环境变量
cp .env.example .env
# 编辑 .env 填入 SECRET_KEY 等（见下）

# 4. 启动
uvicorn app.main:app --host 0.0.0.0 --port 8000
```

启动后：
- API 文档（可视化测试所有接口）：`http://服务器IP:8000/docs`
- 健康检查：`http://服务器IP:8000/api/health`
- 课程数据：`http://服务器IP:8000/api/courses`

首次启动会自动建数据库（`app.db`）并插入初始课程。

## 配置 .env

```bash
# 生成随机 SECRET_KEY
python3 -c "import secrets; print(secrets.token_hex(32))"
```

把生成的值填进 `.env` 的 `SECRET_KEY`。白名单 `ALLOWED_EMAILS` 已默认设为你的邮箱。

`GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` 需要在 Google 后台创建，见下。

## 配置谷歌登录（OAuth）

> 谷歌要求 OAuth 回调地址必须是 HTTPS（localhost 除外）。所以谷歌登录要真正跑通，需要先把网站部署到 HTTPS 域名下（下个部署阶段做）。这里先把后台准备好。

1. 打开 https://console.cloud.google.com/
2. 顶部创建一个项目（随便起名，比如 `python-learn`）
3. 左侧菜单 → **API 和服务** → **OAuth 同意屏幕**
   - User Type 选 **外部（External）**
   - 填应用名称、你的邮箱，其余可跳过
   - 测试用户里把 `yangtianwei600@gmail.com` 加进去
4. 左侧 → **凭据** → **创建凭据** → **OAuth 客户端 ID**
   - 应用类型选 **Web 应用**
   - **已获授权的重定向 URI** 填：
     - 本地测试：`http://localhost:8000/api/auth/callback`
     - 正式部署：`https://learn.yang-888.com/api/auth/callback`
   - 创建后会给你 **客户端 ID** 和 **客户端密钥**
5. 把这两个值填进 `.env` 的 `GOOGLE_CLIENT_ID` 和 `GOOGLE_CLIENT_SECRET`
6. `.env` 里 `BASE_URL` 改成你实际的公网地址（要和上面的重定向 URI 同域）

登录流程：浏览器访问 `/api/auth/login` → 跳转谷歌 → 授权 → 回调校验白名单 → 登录成功。不在白名单的邮箱会被 403 拒绝。

## API 一览

认证
- `GET /api/auth/login` 跳转谷歌登录
- `GET /api/auth/callback` 谷歌回调（白名单校验）
- `GET /api/auth/me` 当前登录用户
- `POST /api/auth/logout` 登出

内容
- `GET /api/courses` 课程列表
- `GET /api/lessons/{id}` 章节详情（含练习）
- `GET /api/exercises/{id}` 单个练习

进度
- `GET /api/progress` 进度概览（打卡 + 各课程完成数 + 待复习数）
- `POST /api/progress/lessons/{id}/complete` 标记章节完成
- `POST /api/progress/exercises/{id}/attempt` 记录练习提交

复习（间隔重复 SM-2）
- `GET /api/review/due` 今日待复习
- `POST /api/review/{item_id}` 提交复习结果（quality 0-5）

## 数据备份

数据库就是 `backend/app.db` 一个文件。定期把它复制到 VPS 之外（云存储 / 私有 git）即可，不依赖服务器商的备份。
