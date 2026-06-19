# 满血 Python 执行环境镜像（4核4GB 服务器版）
# 基于官方 slim，预装接单变现常用的强力库：爬虫 / 数据 / AI / 浏览器自动化
FROM python:3.11-slim

# 系统依赖（lxml / pillow / matplotlib / playwright 浏览器编译与运行需要）
RUN apt-get update && apt-get install -y --no-install-recommends \
    gcc g++ \
    libxml2-dev libxslt1-dev \
    fonts-dejavu-core \
    && rm -rf /var/lib/apt/lists/*

# ---- Python 强力库 ----
# 爬虫/网络：requests httpx aiohttp；解析 beautifulsoup4 lxml parsel
#           反爬 cloudscraper fake-useragent；重试 tenacity
# 数据：pandas numpy openpyxl xlrd tabulate pillow matplotlib
# AI：openai anthropic tiktoken
# 数据库客户端：SQLAlchemy redis pymysql psycopg2-binary pymongo
# 工具：rich tqdm python-dateutil pydantic jsonpath-ng pytz
RUN pip install --no-cache-dir \
    requests httpx aiohttp \
    beautifulsoup4 lxml parsel \
    cloudscraper fake-useragent tenacity \
    pandas numpy openpyxl xlrd tabulate pillow matplotlib \
    openai anthropic tiktoken \
    SQLAlchemy redis pymysql psycopg2-binary pymongo \
    rich tqdm python-dateutil pydantic jsonpath-ng pytz \
    playwright

# Playwright 的 Chromium 浏览器（体积大，约数百 MB）
RUN playwright install chromium && \
    playwright install-deps chromium

WORKDIR /code
