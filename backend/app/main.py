from contextlib import asynccontextmanager
from pathlib import Path

from fastapi import FastAPI
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles
from starlette.middleware.sessions import SessionMiddleware

from .config import settings
from .database import Base, engine, SessionLocal
from . import models  # noqa: F401  确保模型被注册
from .seed import seed_content
from .routers import auth, content, progress, review


@asynccontextmanager
async def lifespan(app: FastAPI):
    # 建表 + 种子数据
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        seed_content(db)
    finally:
        db.close()
    yield


app = FastAPI(title="Python 学习平台 API", lifespan=lifespan)

# 会话（谷歌登录状态 + 登录后用户 id 都存这里）
app.add_middleware(
    SessionMiddleware,
    secret_key=settings.secret_key,
    same_site="lax",
    https_only=settings.cookie_secure,
)

# API 路由
app.include_router(auth.router)
app.include_router(content.router)
app.include_router(progress.router)
app.include_router(review.router)


@app.get("/api/health")
def health():
    return {"status": "ok", "google_login": settings.google_configured}


# ── 托管前端构建产物（同源，免 CORS / 免跨域 Cookie 麻烦）──
# 前端已 build 时才挂载；没 build 也不影响后端 API 启动。
_frontend_dist = Path(__file__).resolve().parent.parent.parent / "frontend" / "dist"
_assets_dir = _frontend_dist / "assets"
_index_file = _frontend_dist / "index.html"

if _assets_dir.exists():
    app.mount("/assets", StaticFiles(directory=_assets_dir), name="assets")


if _index_file.exists():

    @app.get("/{full_path:path}")
    def spa_fallback(full_path: str):
        # API 路由已在上方注册，会优先匹配；这里只兜前端页面
        return FileResponse(_index_file)
