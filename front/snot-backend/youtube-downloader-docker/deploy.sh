# deploy.sh (deployment script)
#!/bin/bash
set -e

ENV=${1:-prod}

echo "🚀 Deploying YouTube Downloader to $ENV environment..."

if [ "$ENV" = "prod" ]; then
    echo "📦 Building production image..."
    docker build -f Dockerfile.prod -t youtube-downloader:prod .
    
    echo "🌐 Starting production services..."
    docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d
else
    echo "🛠️ Starting development services..."
    docker-compose -f docker-compose.yml -f docker-compose.override.yml up -d
fi

echo "✅ Deployment complete!"
docker-compose ps