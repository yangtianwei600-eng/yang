from datetime import datetime
from fastapi import APIRouter, Request, Depends, HTTPException
from fastapi.responses import RedirectResponse
from sqlalchemy.orm import Session

from ..database import get_db
from ..auth import oauth
from ..config import settings
from ..models import User
from ..deps import get_current_user
from ..activity import touch_activity
from ..schemas import UserOut

router = APIRouter(prefix="/api/auth", tags=["auth"])


@router.get("/login")
async def login(request: Request):
    if not settings.google_configured:
        raise HTTPException(503, "谷歌登录尚未配置")
    redirect_uri = f"{settings.base_url}/api/auth/callback"
    return await oauth.google.authorize_redirect(request, redirect_uri)


@router.get("/callback")
async def callback(request: Request, db: Session = Depends(get_db)):
    if not settings.google_configured:
        raise HTTPException(503, "谷歌登录尚未配置")
    try:
        token = await oauth.google.authorize_access_token(request)
    except Exception:
        raise HTTPException(400, "登录失败，请重试")

    userinfo = token.get("userinfo")
    if not userinfo or not userinfo.get("email"):
        raise HTTPException(400, "无法获取谷歌账号信息")

    email = userinfo["email"].lower()

    # 白名单校验：不在名单内一律拒绝
    if email not in settings.allowed_email_set:
        raise HTTPException(403, "无权访问")

    # 建/更新用户
    user = db.query(User).filter(User.email == email).first()
    if not user:
        user = User(
            email=email,
            name=userinfo.get("name", ""),
            picture=userinfo.get("picture", ""),
        )
        db.add(user)
    else:
        user.name = userinfo.get("name", user.name)
        user.picture = userinfo.get("picture", user.picture)

    touch_activity(user)
    user.last_login_at = datetime.utcnow()
    db.commit()
    db.refresh(user)

    request.session["user_id"] = user.id
    return RedirectResponse(url="/")


@router.get("/me", response_model=UserOut)
async def me(user: User = Depends(get_current_user)):
    return user


@router.post("/logout")
async def logout(request: Request):
    request.session.clear()
    return {"ok": True}
