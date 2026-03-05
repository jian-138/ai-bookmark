# 使用官方Python运行时作为基础镜像
FROM python:3.11-slim

# 设置环境变量
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PIP_NO_CACHE_DIR=1 \
    PIP_DISABLE_PIP_VERSION_CHECK=1

# 安装系统依赖
RUN apt-get update && apt-get install -y \
    gcc \
    g++ \
    curl \
    && rm -rf /var/lib/apt/lists/*

# 创建非root用户
RUN useradd --create-home --shell /bin/bash app
USER app
WORKDIR /home/app

# 复制依赖文件
COPY --chown=app:app requirements.txt .

# 安装Python依赖
RUN pip install --user --no-cache-dir -r requirements.txt

# 复制应用代码
COPY --chown=app:app . .

# 创建必要的目录
RUN mkdir -p /home/app/logs /home/app/data

# 暴露端口
EXPOSE 8000

# 健康检查
HEALTHCHECK --interval=30s --timeout=30s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:${PORT:-8000}/health || exit 1

# 运行应用
CMD ["sh", "-c", "uvicorn main:app --host 0.0.0.0 --port ${PORT:-8000} --workers ${WORKERS:-2} --timeout-keep-alive ${TIMEOUT:-30} --lifespan on"]