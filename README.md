# Python 学习平台

手机优先的 Python 学习 + 练习 + 接单技能训练平台。服务器端真实执行 Python（含爬虫联网），间隔重复复习，闯关式练习。

## 技术栈

- 前端：React + Vite + TypeScript + Tailwind + Monaco（后续阶段接入）
- 后端：FastAPI + PostgreSQL + Redis（后续阶段）
- 执行：Docker 容器隔离（后续阶段）

## 当前进度

**第一阶段 ✅ 项目骨架 + 全局设计系统 + 四象限布局外壳**

- Vite + React + TS + Tailwind 工程配置
- 设计系统 tokens 全部落地（颜色 / 字体 / 间距 / 圆角）
- Linear/Stripe 深色玻璃风格
- 签名元素「执行光带」（运行时编辑器边缘渐变光带）
- 三档响应式：桌面四象限 / iPad竖屏 / 手机底部tab+抽屉
- 假运行器演示状态机（idle/running/success/error）

> 编辑器目前是静态占位视图，下一阶段接入 Monaco；运行按钮目前是假数据，后续阶段接 WebSocket 到 VPS 真实执行。

## 目录结构

```
python-learn-platform/
├── frontend/              前端工程
│   ├── src/
│   │   ├── components/layout/   四象限布局组件
│   │   ├── hooks/              响应式断点
│   │   ├── lib/               工具函数
│   │   ├── types/             类型定义（含状态机）
│   │   ├── App.tsx            根组件（当前含假运行器）
│   │   ├── main.tsx
│   │   └── index.css          设计系统 CSS + 签名光带动画
│   ├── package.json
│   ├── tailwind.config.js     设计 tokens → 工具类映射
│   └── vite.config.ts
└── README.md
```

## 本地运行

```bash
cd frontend
npm install
npm run dev
# 浏览器打开 http://localhost:5173
```

## 在 VPS 上运行（预览）

```bash
git clone <你的仓库地址>
cd python-learn-platform/frontend
npm install
npm run build      # 构建
npm run preview    # 预览，监听 0.0.0.0:4173
# 浏览器访问 http://<VPS-IP>:4173
```
