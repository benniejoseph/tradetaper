#!/bin/bash
set -e

echo "=== verifying docker environment ==="

# Wait for Docker to be ready
echo 'Waiting for Docker to be ready...'
for i in {1..30}; do
    if command -v docker &> /dev/null; then
        echo 'Docker command found.'
        break
    fi
    echo 'Docker not found currently. Waiting...'
    sleep 10
done

# Version check
echo "Checking versions..."
docker --version || echo "docker command failed"
docker compose version || echo "docker compose command failed"

cd ~/terminal-farm

# Try running compose
echo "Starting containers..."
if docker compose version >/dev/null 2>&1; then
    echo "Using 'docker compose'..."
    sudo docker compose down -v # Reset volumes to fix permissions
    sudo docker compose up -d --build
elif command -v docker-compose >/dev/null 2>&1; then
    echo "Using 'docker-compose'..."
    sudo docker-compose down -v # Reset volumes to fix permissions
    sudo docker-compose up -d --build
else
    echo "Error: Neither 'docker compose' nor 'docker-compose' found."
    echo "Attempting force install of docker-compose..."
    sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
    sudo chmod +x /usr/local/bin/docker-compose
    sudo docker-compose up -d --build
fi

echo "Terminal Farm started successfully!"
