#!/bin/bash
set -e

echo "🚨 Emergency disk space cleanup..."

# Check current space
echo "📊 Current disk usage:"
df -h

# Stop all Docker containers
echo "🛑 Stopping all Docker containers..."
docker stop $(docker ps -aq) 2>/dev/null || true

# Remove ALL Docker data (nuclear option)
echo "💥 Removing ALL Docker data..."
docker system prune -a --volumes --force
docker builder prune --all --force

# Clean up Docker completely
echo "🧹 Deep Docker cleanup..."
sudo systemctl stop docker 2>/dev/null || true
sudo rm -rf /var/lib/docker/tmp/* 2>/dev/null || true
sudo rm -rf /var/lib/docker/overlay2/* 2>/dev/null || true
sudo systemctl start docker 2>/dev/null || true

# Remove logs
echo "🧹 Cleaning logs..."
sudo journalctl --vacuum-time=1d 2>/dev/null || true
sudo find /var/log -type f -name "*.log" -delete 2>/dev/null || true
sudo find /var/log -type f -name "*.gz" -delete 2>/dev/null || true

# Clean tmp directories
echo "🧹 Cleaning temp files..."
sudo rm -rf /tmp/* 2>/dev/null || true
sudo rm -rf /var/tmp/* 2>/dev/null || true

# Clean user cache
echo "🧹 Cleaning user caches..."
rm -rf ~/.cache/* 2>/dev/null || true
rm -rf ~/.local/share/Trash/* 2>/dev/null || true

echo "📊 Disk space after cleanup:"
df -h

echo "✅ Cleanup complete!"