#!/bin/bash

# Production startup script for Railway deployment
set -e

echo "🚀 Starting TradeTaper Backend in Production Mode"
echo "📅 $(date)"
echo "🌍 NODE_ENV: $NODE_ENV"
echo "📡 PORT: $PORT"

# Run database migrations if enabled
if [ "$RUN_MIGRATIONS" = "true" ]; then
    echo "🔄 Running database migrations..."
    npm run migration:run
    echo "✅ Migrations completed"
else
    echo "⏭️  Skipping migrations (RUN_MIGRATIONS != 'true')"
fi

# Check if migrations path and required files exist
if [ ! -d "dist/migrations" ]; then
    echo "⚠️  No migrations directory found at dist/migrations"
    echo "🔧 Creating directory structure..."
    mkdir -p dist/migrations
fi

# Start the application
echo "🚀 Starting application..."
exec node dist/main.js