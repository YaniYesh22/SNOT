# Dockerfile for CNVmp3 YouTube Downloader API
FROM python:3.11-slim

# Install system dependencies
RUN apt-get update && apt-get install -y \
    wget \
    curl \
    unzip \
    gnupg \
    software-properties-common \
    xvfb \
    && rm -rf /var/lib/apt/lists/*

# Install Google Chrome
RUN wget -q -O - https://dl-ssl.google.com/linux/linux_signing_key.pub | apt-key add - \
    && echo "deb [arch=amd64] http://dl.google.com/linux/chrome/deb/ stable main" >> /etc/apt/sources.list.d/google-chrome.list \
    && apt-get update \
    && apt-get install -y google-chrome-stable \
    && rm -rf /var/lib/apt/lists/*

# Install ChromeDriver - automatically match Chrome version
RUN CHROME_VERSION=$(google-chrome --version | awk '{print $3}' | cut -d'.' -f1) \
    && echo "Chrome version: $CHROME_VERSION" \
    && if [ "$CHROME_VERSION" -ge "115" ]; then \
        # For Chrome 115+, use new Chrome for Testing endpoints
        CHROMEDRIVER_VERSION=$(curl -s "https://googlechromelabs.github.io/chrome-for-testing/LATEST_RELEASE_$CHROME_VERSION") \
        && echo "ChromeDriver version: $CHROMEDRIVER_VERSION" \
        && wget -N "https://storage.googleapis.com/chrome-for-testing-public/$CHROMEDRIVER_VERSION/linux64/chromedriver-linux64.zip" \
        && unzip chromedriver-linux64.zip \
        && mv chromedriver-linux64/chromedriver /usr/local/bin/chromedriver \
        && rm -rf chromedriver-linux64.zip chromedriver-linux64; \
    else \
        # For Chrome 114 and below, use legacy endpoints
        CHROMEDRIVER_VERSION=$(curl -s "https://chromedriver.storage.googleapis.com/LATEST_RELEASE_$CHROME_VERSION") \
        && echo "ChromeDriver version: $CHROMEDRIVER_VERSION" \
        && wget -N "http://chromedriver.storage.googleapis.com/$CHROMEDRIVER_VERSION/chromedriver_linux64.zip" \
        && unzip chromedriver_linux64.zip \
        && mv chromedriver /usr/local/bin/chromedriver \
        && rm chromedriver_linux64.zip; \
    fi \
    && chown root:root /usr/local/bin/chromedriver \
    && chmod +x /usr/local/bin/chromedriver \
    && /usr/local/bin/chromedriver --version

# Set work directory
WORKDIR /app

# Create non-root user for security
RUN useradd --create-home --shell /bin/bash cnvmp3 \
    && chown -R cnvmp3:cnvmp3 /app

# Copy requirements first (for better caching)
COPY requirements.txt .

# Install Python dependencies
RUN pip install --no-cache-dir --upgrade pip \
    && pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY . .

# Create temp directory and set permissions
RUN mkdir -p /tmp/cnvmp3_downloads \
    && chown -R cnvmp3:cnvmp3 /tmp/cnvmp3_downloads \
    && chmod 755 /tmp/cnvmp3_downloads

# Set environment variables
ENV PYTHONPATH=/app
ENV TEMP_DIR=/tmp/cnvmp3_downloads
ENV PYTHONUNBUFFERED=1
ENV DISPLAY=:99

# Switch to non-root user
USER cnvmp3

# Expose port
EXPOSE 8000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
    CMD curl -f http://localhost:8000/health || exit 1

# Run the application
CMD ["python", "main.py"]