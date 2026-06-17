from datetime import datetime, date
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func

from ..database import get_db
from ..models import (
    User,
    Course,
    Lesson,
    Exercise,
    LessonProgress,
    ExerciseAttempt,
    ReviewItem,
)
from ..deps import get_current_user
from ..activity import touch_activity
from ..schemas import ProgressOverview, CourseProgress, AttemptIn

router = APIRouter(prefix="/api/progress", tags=["progress"])


@router.get("", response_model=ProgressOverview)
def overview(
    user: User = Depends(get_current_user), db: Session = Depends(get_db)
):
    # 已完成章节 id 集合
    completed_rows = (
        db.query(LessonProgress.lesson_id)
        .filter(
            LessonProgress.user_id == user.id,
            LessonProgress.status == "completed",
        )
        .all()
    )
    completed_ids = {r[0] for r in completed_rows}

    courses = db.query(Course).order_by(Course.order).all()
    course_progress = []
    for c in courses:
        total = len(c.lessons)
        done = sum(1 for lsn in c.lessons if lsn.id in completed_ids)
        course_progress.append(
            CourseProgress(
                course_id=c.id, title=c.title, total_lessons=total, completed_lessons=done
            )
        )

    due_count = (
        db.query(func.count(ReviewItem.id))
        .filter(ReviewItem.user_id == user.id, ReviewItem.due_date <= date.today())
        .scalar()
    )

    return ProgressOverview(
        current_streak=user.current_streak,
        longest_streak=user.longest_streak,
        total_completed_lessons=len(completed_ids),
        due_review_count=due_count or 0,
        courses=course_progress,
    )


@router.post("/lessons/{lesson_id}/complete")
def complete_lesson(
    lesson_id: int,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    lesson = db.get(Lesson, lesson_id)
    if not lesson:
        raise HTTPException(404, "章节不存在")

    progress = (
        db.query(LessonProgress)
        .filter(
            LessonProgress.user_id == user.id,
            LessonProgress.lesson_id == lesson_id,
        )
        .first()
    )
    if not progress:
        progress = LessonProgress(user_id=user.id, lesson_id=lesson_id)
        db.add(progress)
    progress.status = "completed"
    progress.completed_at = datetime.utcnow()

    touch_activity(user)
    db.commit()
    return {"ok": True, "status": "completed"}


@router.post("/exercises/{exercise_id}/attempt")
def record_attempt(
    exercise_id: int,
    body: AttemptIn,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    exercise = db.get(Exercise, exercise_id)
    if not exercise:
        raise HTTPException(404, "练习不存在")

    # 记录提交（执行阶段 passed 将由服务端判定，这里先按传入值）
    attempt = ExerciseAttempt(
        user_id=user.id,
        exercise_id=exercise_id,
        code=body.code,
        passed=body.passed,
    )
    db.add(attempt)

    # 通过则纳入复习计划（若尚未加入）
    if body.passed:
        existing = (
            db.query(ReviewItem)
            .filter(
                ReviewItem.user_id == user.id,
                ReviewItem.exercise_id == exercise_id,
            )
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

    touch_activity(user)
    db.commit()
    return {"ok": True, "passed": body.passed}
