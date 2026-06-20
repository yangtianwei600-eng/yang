# 满血 Python 执行环境镜像（4核4GB 服务器版）
# 基于官方 slim，预装接单变现常用的强力库：爬虫 / 数据 / AI / 浏览器自动化 / 文档 / 图像 / 安全
FROM python:3.11-slim

# Playwright 浏览器统一安装路径（全用户可读，解决 nobody 用户找不到浏览器问题）
ENV PLAYWRIGHT_BROWSERS_PATH=/ms-playwright

# 系统依赖（lxml / pillow / matplotlib / opencv / playwright 浏览器编译与运行需要）
RUN apt-get update && apt-get install -y --no-install-recommends \
    gcc g++ \
    libxml2-dev libxslt1-dev \
    fonts-dejavu-core \
    libgl1 libglib2.0-0 \
    && rm -rf /var/lib/apt/lists/*

# ---- Python 强力库（原有）----
# 爬虫/网络: requests httpx aiohttp; 解析 beautifulsoup4 lxml parsel
#            反爬 cloudscraper fake-useragent; 重试 tenacity
# 数据: pandas numpy openpyxl xlrd tabulate pillow matplotlib
# AI: openai anthropic tiktoken
# 数据库客户端: SQLAlchemy redis pymysql psycopg2-binary pymongo
# 工具: rich tqdm python-dateutil pydantic jsonpath-ng pytz
RUN pip install --no-cache-dir \
    requests httpx aiohttp \
    beautifulsoup4 lxml parsel \
    cloudscraper fake-useragent tenacity \
    pandas numpy openpyxl xlrd tabulate pillow matplotlib \
    openai anthropic tiktoken \
    SQLAlchemy redis pymysql psycopg2-binary pymongo \
    rich tqdm python-dateutil pydantic jsonpath-ng pytz \
    playwright

# ---- Python 强力库（B：装满，覆盖科学/文档/图像/Web/自动化/安全）----
# 科学数据: scipy scikit-learn statsmodels sympy polars seaborn plotly xlsxwriter
# 文档文件: pypdf pdfplumber python-docx python-pptx markdownify html2text chardet pyyaml
# 图像媒体: opencv-python-headless imageio qrcode
# 抓取增强: selenium curl_cffi（requests-html 见下方独立层）
# Web/API: flask fastapi uvicorn websockets jinja2
# 工具: click typer python-dotenv faker validators humanize schedule jieba regex nest-asyncio
# 安全编码: cryptography pyjwt bcrypt
# 网络: paramiko
RUN pip install --no-cache-dir \
    scipy scikit-learn statsmodels sympy polars seaborn plotly xlsxwriter \
    pypdf pdfplumber python-docx python-pptx markdownify html2text chardet pyyaml \
    opencv-python-headless imageio qrcode \
    selenium curl_cffi \
    flask fastapi uvicorn websockets jinja2 \
    click typer python-dotenv faker validators humanize schedule jieba regex nest-asyncio \
    cryptography pyjwt bcrypt \
    paramiko

# requests-html 已停维护且依赖冲突（pin 旧 websockets），单独容错安装：装得上就装，失败不影响镜像
RUN pip install --no-cache-dir requests-html || echo "[skip] requests-html 安装失败，已跳过（功能可用 httpx+parsel+playwright 替代）"

# Playwright 的 Chromium 浏览器（装到 PLAYWRIGHT_BROWSERS_PATH，并放开读权限给 nobody）
RUN playwright install chromium && \
    playwright install-deps chromium && \
    chmod -R 755 /ms-playwright

WORKDIR /code
