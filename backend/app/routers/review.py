from datetime import datetime, date
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from ..database import get_db
from ..models import User, Exercise, ReviewItem
from ..deps import get_current_user
from ..activity import touch_activity
from ..srs import sm2
from ..schemas import ReviewItemOut, ReviewIn

router = APIRouter(prefix="/api/review", tags=["review"])


@router.get("/due", response_model=list[ReviewItemOut])
def due_reviews(
    user: User = Depends(get_current_user), db: Session = Depends(get_db)
):
    items = (
        db.query(ReviewItem)
        .filter(ReviewItem.user_id == user.id, ReviewItem.due_date <= date.today())
        .order_by(ReviewItem.due_date)
        .all()
    )
    out = []
    for it in items:
        ex = db.get(Exercise, it.exercise_id)
        out.append(
            ReviewItemOut(
                id=it.id,
                exercise_id=it.exercise_id,
                exercise_title=ex.title if ex else "(已删除)",
                interval_days=it.interval_days,
                repetitions=it.repetitions,
            )
        )
    return out


@router.post("/{item_id}")
def submit_review(
    item_id: int,
    body: ReviewIn,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    item = db.get(ReviewItem, item_id)
    if not item or item.user_id != user.id:
        raise HTTPException(404, "复习项不存在")

    reps, ef, interval, due = sm2(
        body.quality, item.repetitions, item.ease_factor, item.interval_days
    )
    item.repetitions = reps
    item.ease_factor = ef
    item.interval_days = interval
    item.due_date = due
    item.last_reviewed_at = datetime.utcnow()

    touch_activity(user)
    db.commit()
    return {"ok": True, "next_due": due.isoformat(), "interval_days": interval}
