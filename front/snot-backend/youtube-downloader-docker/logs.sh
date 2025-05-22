# logs.sh (logs script)
#!/bin/bash
if [ -z "$1" ]; then
    echo "📋 Showing all service logs..."
    docker-compose logs -f
else
    echo "📋 Showing logs for service: $1"
    docker-compose logs -f "$1"
fi