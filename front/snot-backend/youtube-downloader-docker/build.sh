# build.sh (build script)
#!/bin/bash
set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${GREEN}🐳 Building YouTube Downloader Docker Image${NC}"

# Check if Docker is running
if ! docker info >/dev/null 2>&1; then
    echo -e "${RED}❌ Docker is not running${NC}"
    exit 1
fi

# Build the image
echo -e "${YELLOW}📦 Building Docker image...${NC}"
docker build -t youtube-downloader:latest .

# Check if build was successful
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Docker image built successfully${NC}"
    echo -e "${GREEN}📋 Image details:${NC}"
    docker images youtube-downloader:latest
else
    echo -e "${RED}❌ Docker build failed${NC}"
    exit 1
fi