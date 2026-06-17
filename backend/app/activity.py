from datetime import date, timedelta
from .models import User


def touch_activity(user: User) -> None:
    """记录一次今日活动，维护连续打卡。同一天多次调用只算一次。"""
    today = date.today()
    if user.last_activity_date == today:
        return
    if user.last_activity_date == today - timedelta(days=1):
        user.current_streak += 1
    else:
        user.current_streak = 1
    user.longest_streak = max(user.longest_streak, user.current_streak)
    user.last_activity_date = today
