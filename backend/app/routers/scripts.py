"""用户脚本管理：满血工作台里保存的代码。"""
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session

from ..database import get_db
from ..deps import get_current_user
from ..models import User, Script

router = APIRouter(prefix="/api/scripts", tags=["scripts"])


class ScriptIn(BaseModel):
    title: str = "未命名脚本"
    code: str = ""


class ScriptUpdate(BaseModel):
    title: str | None = None
    code: str | None = None


class ScriptSummary(BaseModel):
    id: int
    title: str
    updated_at: datetime
    model_config = {"from_attributes": True}


class ScriptOut(BaseModel):
    id: int
    title: str
    code: str
    updated_at: datetime
    model_config = {"from_attributes": True}


@router.get("", response_model=list[ScriptSummary])
def list_scripts(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    return (
        db.query(Script)
        .filter(Script.user_id == user.id)
        .order_by(Script.updated_at.desc())
        .all()
    )


@router.post("", response_model=ScriptOut)
def create_script(
    body: ScriptIn,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    script = Script(user_id=user.id, title=body.title or "未命名脚本", code=body.code)
    db.add(script)
    db.commit()
    db.refresh(script)
    return script


@router.get("/{script_id}", response_model=ScriptOut)
def get_script(
    script_id: int,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    script = db.get(Script, script_id)
    if not script or script.user_id != user.id:
        raise HTTPException(404, "脚本不存在")
    return script


@router.put("/{script_id}", response_model=ScriptOut)
def update_script(
    script_id: int,
    body: ScriptUpdate,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    script = db.get(Script, script_id)
    if not script or script.user_id != user.id:
        raise HTTPException(404, "脚本不存在")
    if body.title is not None:
        script.title = body.title
    if body.code is not None:
        script.code = body.code
    db.commit()
    db.refresh(script)
    return script


@router.delete("/{script_id}")
def delete_script(
    script_id: int,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    script = db.get(Script, script_id)
    if not script or script.user_id != user.id:
        raise HTTPException(404, "脚本不存在")
    db.delete(script)
    db.commit()
    return {"ok": True}
