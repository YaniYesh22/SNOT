# stop.sh (stop script)
#!/bin/bash
echo "🛑 Stopping YouTube Downloader services..."
docker-compose down

echo "🧹 Cleaning up..."
docker-compose down -v --remove-orphans

echo "✅ Services stopped successfully"