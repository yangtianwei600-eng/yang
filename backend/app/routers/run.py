import asyncio
"""代码执行相关路由：自由运行 + 练习判题。"""
from datetime import date
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session

from ..database import get_db
from ..deps import get_current_user
from ..models import User, Exercise, ExerciseAttempt, ReviewItem
from ..executor import run_python
from ..activity import touch_activity

router = APIRouter(prefix="/api/run", tags=["run"])


class RunIn(BaseModel):
    code: str


class RunOut(BaseModel):
    stdout: str
    stderr: str
    exit_code: int
    timed_out: bool
    duration_ms: int


class JudgeOut(RunOut):
    passed: bool
    expected_output: str | None = None  # 判错时回传预期，方便对照


@router.post("", response_model=RunOut)
async def run_code(body: RunIn, user: User = Depends(get_current_user)):
    """自由运行任意 Python 代码（沙箱）。"""
    if len(body.code) > 50_000:
        raise HTTPException(status_code=400, detail="代码过长")
    result = await run_python(body.code)
    return RunOut(
        stdout=result.stdout,
        stderr=result.stderr,
        exit_code=result.exit_code,
        timed_out=result.timed_out,
        duration_ms=result.duration_ms,
    )


@router.post("/exercises/{exercise_id}", response_model=JudgeOut)
async def judge_exercise(
    exercise_id: int,
    body: RunIn,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """运行用户代码并与练习预期输出比对，服务端判定是否通过。"""
    exercise = db.get(Exercise, exercise_id)
    if not exercise:
        raise HTTPException(status_code=404, detail="练习不存在")
    if len(body.code) > 50_000:
        raise HTTPException(status_code=400, detail="代码过长")

    result = await run_python(body.code)

    # 判题：精确比对（去掉首尾空白）。有预期答案才判，否则只看是否正常运行。
    expected = (exercise.expected_output or "").strip()
    actual = result.stdout.strip()
    if expected:
        passed = (not result.timed_out) and result.exit_code == 0 and actual == expected
    else:
        passed = (not result.timed_out) and result.exit_code == 0

    # 记录尝试
    attempt = ExerciseAttempt(
        user_id=user.id,
        exercise_id=exercise_id,
        code=body.code,
        passed=passed,
    )
    db.add(attempt)

    # 通过则打卡 + 加入复习计划（若尚未加入）
    if passed:
        touch_activity(user)
        existing = (
            db.query(ReviewItem)
            .filter(ReviewItem.user_id == user.id, ReviewItem.exercise_id == exercise_id)
            .first()
        )
        if not existing:
            db.add(
                ReviewItem(
                    user_id=user.id,
                    exercise_id=exercise_id,
                    due_date=date.today(),
                )
            )

    db.commit()

    return JudgeOut(
        stdout=result.stdout,
        stderr=result.stderr,
        exit_code=result.exit_code,
        timed_out=result.timed_out,
        duration_ms=result.duration_ms,
        passed=passed,
        expected_output=None if passed else (exercise.expected_output or None),
    )


# ============ 交互式运行 WebSocket 端点（C：交互终端）============
# 路径：/api/run/ws （run.router 已在 main.py include，自动挂载）
from fastapi import WebSocket, WebSocketDisconnect
from ..executor import InteractiveSession


@router.websocket("/ws")
async def run_ws(ws: WebSocket):
    """交互式运行：容器常驻，stdin/stdout 实时双向桥接。"""
    uid = ws.session.get("user_id") if hasattr(ws, "session") else None
    if not uid:
        await ws.close(code=4401)
        return

    await ws.accept()
    session = InteractiveSession()
    pump_task = None

    async def _pump_to_client():
        try:
            async for stream, text in session.stream_output():
                await ws.send_json({"type": "output", "stream": stream, "data": text})
            code = await session.wait()
            await ws.send_json({"type": "exit", "code": code})
        except Exception:
            pass

    try:
        while True:
            msg = await ws.receive_json()
            mtype = msg.get("type")
            if mtype == "start":
                code = msg.get("code", "")
                if len(code) > 50_000:
                    await ws.send_json({"type": "error", "data": "代码过长"})
                    continue
                if session.proc is not None:
                    await session.kill()
                    session = InteractiveSession()
                await session.start(code)
                pump_task = asyncio.create_task(_pump_to_client())
            elif mtype == "stdin":
                await session.write_stdin(msg.get("data", ""))
            elif mtype == "eof":
                await session.close_stdin()
    except WebSocketDisconnect:
        pass
    except Exception as e:
        try:
            await ws.send_json({"type": "error", "data": str(e)})
        except Exception:
            pass
    finally:
        if pump_task and not pump_task.done():
            pump_task.cancel()
        await session.kill()
