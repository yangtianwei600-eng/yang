from datetime import date, timedelta


def sm2(quality: int, repetitions: int, ease_factor: float, interval_days: int):
    """SM-2 间隔重复算法。

    quality: 0-5，本次回忆质量（<3 视为没记住）
    返回: (repetitions, ease_factor, interval_days, due_date)
    """
    quality = max(0, min(5, quality))

    if quality < 3:
        # 没记住：重置，明天再来
        repetitions = 0
        interval_days = 1
    else:
        if repetitions == 0:
            interval_days = 1
        elif repetitions == 1:
            interval_days = 6
        else:
            interval_days = round(interval_days * ease_factor)
        repetitions += 1

    # 更新难度系数
    ease_factor = ease_factor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02))
    if ease_factor < 1.3:
        ease_factor = 1.3

    due_date = date.today() + timedelta(days=interval_days)
    return repetitions, ease_factor, interval_days, due_date
