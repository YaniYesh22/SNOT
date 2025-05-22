# run.sh (run script)
#!/bin/bash
set -e

# Check if .env file exists
if [ ! -f .env ]; then
    echo "⚠️  .env file not found. Creating from .env.example..."
    if [ -f .env.example ]; then
        cp .env.example .env
        echo "📝 Please edit .env file with your configuration"
        exit 1
    else
        echo "❌ .env.example file not found"
        exit 1
    fi
fi

# Load environment variables
source .env

# Check required variables
if [ -z "$S3_BUCKET" ]; then
    echo "❌ S3_BUCKET not set in .env file"
    exit 1
fi

echo "🚀 Starting YouTube Downloader with Docker Compose..."

# Start services
docker-compose up -d

# Show status
echo "📊 Service status:"
docker-compose ps

echo "🌐 API available at: http://localhost:8000"
echo "📚 Documentation at: http://localhost:8000/docs"
echo "🔍 To view logs: docker-compose logs -f"

