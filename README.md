# 小杨 PRO  个人满血 Python 云 IDE

跑在自有服务器上的个人 Python 云端开发环境。打开网页即可远程编写并执行 Python,支持交互式输入、自由 pip 装库、文件持久化,所有代码在隔离的一次性 Docker 容器中运行。

## 核心能力
- 远程执行:浏览器内写 Python,提交到服务器执行,实时回传 stdout / stderr
- 交互终端:WebSocket 交互式运行,完整支持 input(),输入零延迟、输出流式
- 自由装库:编辑器内直接 pip install,装入持久工作区,跨会话长期可用
- 文件持久化:程序在 /workspace 下的读写长期保留
- 满血生态:scraping / 数据科学 / AI / 数据库客户端 / Playwright 全部预装
- Google 一键登录,云端多脚本管理

## 安全模型
每次执行启动一次性容器:根文件系统只读(仅 /workspace 与 /tmp 可写)、非 root 运行(nobody)、丢弃全部 Linux capability、no-new-privileges、内存与进程数硬上限、超时强杀;保留网络以支撑爬虫与 API。

## 技术栈
前端 React + Vite + TypeScript + Tailwind;后端 FastAPI + SQLAlchemy + SQLite;执行层 Docker 一次性容器 + WebSocket 双向流;部署经 Nginx 反向代理 + Cloudflare,全程 HTTPS,后端同源托管前端构建产物。

## 部署与迁移
完整恢复流程见 deploy/RESTORE.md;deploy/learn.service 为服务单元快照,deploy/nginx.conf 为反代快照,deploy/ENV-SNAPSHOT.txt 记录环境版本与仓库地址。
