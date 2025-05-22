# Ultra-minimal Dockerfile for tight disk space
FROM python:3.11-alpine

# Set working directory
WORKDIR /app

# Install only absolutely essential system dependencies
RUN apk add --no-cache \
    ffmpeg \
    curl \
    && rm -rf /var/cache/apk/*

# Copy requirements and install in stages to reduce peak disk usage
COPY requirements.txt .

# Install Python packages one by one to reduce peak disk usage
RUN pip install --no-cache-dir fastapi==0.104.1 && \
    pip install --no-cache-dir uvicorn[standard]==0.24.0 && \
    pip install --no-cache-dir yt-dlp==2023.11.16 && \
    pip install --no-cache-dir pydub==0.25.1 && \
    pip install --no-cache-dir boto3==1.34.0 && \
    pip install --no-cache-dir python-multipart==0.0.6 && \
    pip install --no-cache-dir requests==2.31.0 && \
    pip cache purge

# Copy application
COPY main.py .

# Create temp directory and user
RUN mkdir -p /tmp/youtube_downloads && \
    adduser -D -u 1000 appuser && \
    chown -R appuser:appuser /app /tmp/youtube_downloads

USER appuser

EXPOSE 8000

# Simple healthcheck
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:8000/health || exit 1

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]