from sqlalchemy.orm import Session
from .models import Course, Lesson, Exercise


def seed_content(db: Session) -> None:
    """首次启动插入初始内容。已有课程则跳过（幂等）。"""
    if db.query(Course).count() > 0:
        return

    # ── 课程 1：Python 基础 ──
    basics = Course(
        slug="python-basics",
        title="Python 基础",
        description="变量、控制流、函数、数据结构。接单赚钱的垫脚石，快速过。",
        order=1,
    )
    basics.lessons = [
        Lesson(
            slug="hello",
            title="第一行代码",
            order=1,
            content="# 第一行代码\n\nPython 用 `print()` 输出内容。这是所有程序的起点。",
            exercises=[
                Exercise(
                    title="打印 Hello",
                    prompt="用 print 输出 Hello, Python",
                    starter_code='print("Hello, Python")\n',
                    expected_output="Hello, Python",
                    order=1,
                ),
            ],
        ),
        Lesson(
            slug="variables",
            title="变量与数据类型",
            order=2,
            content="# 变量\n\n变量用来存数据。Python 不用声明类型，直接赋值。",
            exercises=[
                Exercise(
                    title="计算求和",
                    prompt="定义 a=3, b=5，打印它们的和",
                    starter_code="a = 3\nb = 5\nprint(a + b)\n",
                    expected_output="8",
                    order=1,
                ),
            ],
        ),
    ]

    # ── 课程 2：爬虫基础 ──
    crawler = Course(
        slug="crawler-basics",
        title="爬虫基础",
        description="requests + BeautifulSoup 抓取网页。最快能变现的第一个真本事。",
        order=2,
    )
    crawler.lessons = [
        Lesson(
            slug="requests-get",
            title="用 requests 抓取网页",
            order=1,
            content=(
                "# 用 requests 抓取网页\n\n"
                "`requests.get(url)` 发起请求，`.text` 拿到网页源码。\n\n"
                "记得加 `timeout`，避免卡死。"
            ),
            exercises=[
                Exercise(
                    title="抓取并打印状态码",
                    prompt="抓取 https://example.com，打印响应状态码（应为 200）",
                    starter_code=(
                        "import requests\n\n"
                        'resp = requests.get("https://example.com", timeout=10)\n'
                        "print(resp.status_code)\n"
                    ),
                    expected_output="200",
                    order=1,
                ),
            ],
        ),
        Lesson(
            slug="parse-html",
            title="用 BeautifulSoup 解析",
            order=2,
            content=(
                "# 解析 HTML\n\n"
                "`BeautifulSoup(html, 'html.parser')` 把源码变成可查询的结构，"
                "再用 `.select()` 按 CSS 选择器取元素。"
            ),
            exercises=[
                Exercise(
                    title="提取标题",
                    prompt="解析 example.com，打印页面 <h1> 的文本",
                    starter_code=(
                        "import requests\n"
                        "from bs4 import BeautifulSoup\n\n"
                        'resp = requests.get("https://example.com", timeout=10)\n'
                        'soup = BeautifulSoup(resp.text, "html.parser")\n'
                        'print(soup.select_one("h1").text)\n'
                    ),
                    expected_output="Example Domain",
                    order=1,
                ),
            ],
        ),
    ]

    db.add_all([basics, crawler])
    db.commit()
