FROM python:3.11-slim
RUN apt-get update && apt-get install -y --no-install-recommends \
    gcc g++ libxml2-dev libxslt1-dev \
    && rm -rf /var/lib/apt/lists/*
RUN pip install --no-cache-dir \
    requests httpx beautifulsoup4 lxml \
    pandas numpy openpyxl \
    SQLAlchemy redis openai playwright
RUN playwright install chromium && playwright install-deps chromium
WORKDIR /code
