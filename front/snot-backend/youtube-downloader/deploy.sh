#!/bin/bash
# deploy.sh - Easy deployment script for CNVmp3 YouTube Downloader API

set -e

echo "🎵 CNVmp3 YouTube Downloader API - Deployment Script"
echo "======================================================"

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo "❌ Docker is not installed!"
    echo "📥 Please install Docker first:"
    echo "   Ubuntu/Debian: curl -fsSL https://get.docker.com -o get-docker.sh && sh get-docker.sh"
    echo "   Or visit: https://docs.docker.com/get-docker/"
    exit 1
fi

# Check if Docker Compose is installed
if ! command -v docker-compose &> /dev/null; then
    echo "❌ Docker Compose is not installed!"
    echo "📥 Please install Docker Compose first:"
    echo "   sudo curl -L \"https://github.com/docker/compose/releases/latest/download/docker-compose-\$(uname -s)-\$(uname -m)\" -o /usr/local/bin/docker-compose"
    echo "   sudo chmod +x /usr/local/bin/docker-compose"
    exit 1
fi

echo "✅ Docker and Docker Compose are installed"

# Create .env file if it doesn't exist
if [ ! -f .env ]; then
    echo "📝 Creating .env file..."
    cat > .env << 'EOF'
# AWS S3 Configuration (Optional - for cloud storage)
# Leave blank if you don't want to use S3
AWS_REGION=eu-central-1
S3_BUCKET=
AWS_ACCESS_KEY_ID=
AWS_SECRET_ACCESS_KEY=

# Application Settings
MAX_CONCURRENT_DOWNLOADS=3
DOWNLOAD_TIMEOUT=300
EOF
    
    echo "⚠️  .env file created with default settings."
    echo "   Edit .env to configure S3 storage (optional)"
    echo ""
fi

# # Ask user about S3 configuration
# echo "🔧 Configuration Options:"
# echo "1. Use local storage only (files stored temporarily on server)"
# echo "2. Configure AWS S3 storage (recommended for production)"
# echo ""
# read -p "Choose option (1 or 2): " storage_option

# if [ "$storage_option" = "2" ]; then
#     echo ""
#     echo "📝 AWS S3 Configuration:"
#     read -p "AWS Region (default: eu-central-1): " aws_region
#     read -p "S3 Bucket Name: " s3_bucket
#     read -p "AWS Access Key ID: " aws_access_key
#     read -s -p "AWS Secret Access Key: " aws_secret_key
#     echo ""
    
#     # Update .env file
    sed -i "s/AWS_REGION=.*/AWS_REGION=${aws_region:-eu-central-1}/" .env
    sed -i "s/S3_BUCKET=.*/S3_BUCKET=${s3_bucket}/" .env
    sed -i "s/AWS_ACCESS_KEY_ID=.*/AWS_ACCESS_KEY_ID=${aws_access_key}/" .env
    sed -i "s/AWS_SECRET_ACCESS_KEY=.*/AWS_SECRET_ACCESS_KEY=${aws_secret_key}/" .env
    
#     echo "✅ S3 configuration updated"
# else
#     echo "✅ Using local storage mode"
# fi

echo ""
echo "🚀 Starting deployment..."

# Stop existing containers
echo "🛑 Stopping existing containers..."
docker-compose down 2>/dev/null || true

# Build the image
echo "🔨 Building Docker image..."
docker-compose build

# Start the services
echo "🔄 Starting services..."
docker-compose up -d

# Wait for service to be ready
echo "⏳ Waiting for service to start..."
sleep 10

# Test the service
echo "🧪 Testing the service..."
if curl -f http://localhost:8000/health >/dev/null 2>&1; then
    echo "✅ Service is running successfully!"
    echo ""
    echo "🌐 API Endpoints:"
    echo "   Health Check: http://localhost:8000/health"
    echo "   API Docs:     http://localhost:8000/docs"
    echo "   Download:     POST http://localhost:8000/download"
    echo ""
    echo "📚 Usage Example:"
    echo "   curl -X POST 'http://localhost:8000/download' \\"
    echo "        -H 'Content-Type: application/json' \\"
    echo "        -d '{\"url\": \"https://www.youtube.com/watch?v=dQw4w9WgXcQ\", \"format\": \"mp4\"}'"
    echo ""
    echo "📊 View logs: docker-compose logs -f"
    echo "🛑 Stop service: docker-compose down"
else
    echo "❌ Service failed to start properly"
    echo "📊 Check logs: docker-compose logs"
    exit 1
fi

echo "🎉 Deployment completed successfully!"