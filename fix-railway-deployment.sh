#!/bin/bash
set -e

echo "🚀 Fixing Railway deployment for TradeTaper Backend..."

# Navigate to backend directory
cd tradetaper-backend

echo "📦 Installing dependencies..."
npm install --legacy-peer-deps

echo "🏗️  Building project..."
npm run build

echo "✅ Build completed successfully!"

echo "📋 Checking dist directory..."
ls -la dist/

echo "🔍 Checking main.js exists..."
if [ -f "dist/main.js" ]; then
    echo "✅ main.js found in dist/"
else
    echo "❌ main.js not found in dist/"
    exit 1
fi

echo "🚀 Forcing Railway deployment..."
railway up --detach

echo "✅ Railway deployment triggered!"
echo "⏳ Waiting for deployment to complete (this may take a few minutes)..."

# Wait for deployment
sleep 30

echo "🧪 Testing endpoints..."
echo "Testing health endpoint..."
curl -s https://tradetaper-backend-production.up.railway.app/api/v1/health | jq .

echo "Testing ping endpoint..."
curl -s https://tradetaper-backend-production.up.railway.app/api/v1/ping | jq .

echo "✅ Railway deployment fix complete!"