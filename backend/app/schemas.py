from pydantic import BaseModel


# ── 用户 ──
class UserOut(BaseModel):
    id: int
    email: str
    name: str
    picture: str
    current_streak: int
    longest_streak: int
    model_config = {"from_attributes": True}


# ── 内容 ──
class ExerciseOut(BaseModel):
    # 故意不含 expected_output：答案留服务端
    id: int
    title: str
    prompt: str
    starter_code: str
    order: int
    model_config = {"from_attributes": True}


class LessonSummary(BaseModel):
    id: int
    slug: str
    title: str
    order: int
    model_config = {"from_attributes": True}


class LessonDetail(BaseModel):
    id: int
    slug: str
    title: str
    content: str
    order: int
    exercises: list[ExerciseOut]
    model_config = {"from_attributes": True}


class CourseOut(BaseModel):
    id: int
    slug: str
    title: str
    description: str
    order: int
    lessons: list[LessonSummary]
    model_config = {"from_attributes": True}


# ── 请求体 ──
class AttemptIn(BaseModel):
    code: str
    passed: bool = False


class ReviewIn(BaseModel):
    quality: int  # 0-5，回忆质量


# ── 进度概览 ──
class CourseProgress(BaseModel):
    course_id: int
    title: str
    total_lessons: int
    completed_lessons: int


class ProgressOverview(BaseModel):
    current_streak: int
    longest_streak: int
    total_completed_lessons: int
    due_review_count: int
    courses: list[CourseProgress]


# ── 复习项 ──
class ReviewItemOut(BaseModel):
    id: int
    exercise_id: int
    exercise_title: str
    interval_days: int
    repetitions: int
