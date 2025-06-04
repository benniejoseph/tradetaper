#!/bin/bash

# TradeTaper Deployment Script
echo "🚀 TradeTaper Deployment Script"
echo "================================"

# Check if we're in the right directory
if [ ! -d "tradetaper-frontend" ] || [ ! -d "tradetaper-backend" ] || [ ! -d "tradetaper-admin" ]; then
    echo "❌ Error: Please run this script from the TradeTaper root directory"
    exit 1
fi

echo "📦 Building all projects..."

# Build backend
echo "🔨 Building backend..."
cd tradetaper-backend
npm install
npm run build
if [ $? -ne 0 ]; then
    echo "❌ Backend build failed"
    exit 1
fi
echo "✅ Backend build successful"

# Build frontend
echo "🔨 Building frontend..."
cd ../tradetaper-frontend
npm install
npm run build
if [ $? -ne 0 ]; then
    echo "❌ Frontend build failed"
    exit 1
fi
echo "✅ Frontend build successful"

# Note about admin dashboard
echo "⚠️  Admin dashboard has TypeScript issues - will need manual fixes"
echo "   You can deploy it as-is and fix issues in production"

cd ..

echo ""
echo "🎉 Build Complete!"
echo "=================="
echo ""
echo "Next Steps:"
echo "1. Commit and push your code:"
echo "   git add ."
echo "   git commit -m 'Ready for deployment'"
echo "   git push origin main"
echo ""
echo "2. Follow the deployment guide in DEPLOYMENT_GUIDE.md"
echo ""
echo "3. Deploy in this order:"
echo "   a) Backend to Railway"
echo "   b) Frontend to Vercel"
echo "   c) Admin Dashboard to Vercel"
echo ""
echo "4. Update environment variables with actual URLs"
echo ""
echo "📖 Full guide: DEPLOYMENT_GUIDE.md" 