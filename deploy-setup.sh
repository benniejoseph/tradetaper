#!/bin/bash

# TradeTaper Deployment Setup Script
# Run this script to prepare your application for deployment

echo "🚀 TradeTaper Deployment Setup"
echo "==============================="

# Check if we're in the right directory
if [ ! -d "tradetaper-frontend" ] || [ ! -d "tradetaper-backend" ]; then
    echo "❌ Error: Please run this script from the TradeTaper root directory"
    exit 1
fi

echo "📦 Preparing backend for deployment..."

# Backend preparation
cd tradetaper-backend

# Install dependencies
echo "📥 Installing backend dependencies..."
npm install

# Build the project to check for errors
echo "🔨 Building backend..."
npm run build

if [ $? -ne 0 ]; then
    echo "❌ Backend build failed. Please fix errors before deploying."
    exit 1
fi

echo "✅ Backend build successful!"

# Frontend preparation
cd ../tradetaper-frontend

echo "📦 Preparing frontend for deployment..."

# Install dependencies
echo "📥 Installing frontend dependencies..."
npm install

# Build the project to check for errors
echo "🔨 Building frontend..."
npm run build

if [ $? -ne 0 ]; then
    echo "❌ Frontend build failed. Please fix errors before deploying."
    exit 1
fi

echo "✅ Frontend build successful!"

cd ..

echo ""
echo "🎉 Setup Complete!"
echo "==================="
echo ""
echo "Your TradeTaper application is ready for deployment!"
echo ""
echo "Next Steps:"
echo "1. Commit your code to GitHub:"
echo "   git add ."
echo "   git commit -m 'Prepare for deployment'"
echo "   git push origin main"
echo ""
echo "2. Deploy Backend to Railway:"
echo "   - Go to railway.app"
echo "   - Connect your GitHub repository"
echo "   - Add PostgreSQL database"
echo "   - Configure environment variables"
echo ""
echo "3. Deploy Frontend to Vercel:"
echo "   - Go to vercel.com"
echo "   - Connect your GitHub repository"
echo "   - Set root directory to 'tradetaper-frontend'"
echo "   - Configure environment variables"
echo ""
echo "4. Read the full deployment guide: DEPLOYMENT.md"
echo ""
echo "💰 Estimated monthly cost: $0-5 (within free tiers)" 