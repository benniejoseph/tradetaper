#!/bin/bash

# TradeTaper Development Environment Setup Script
# This script creates .env files for local development

echo "🔧 Setting up TradeTaper development environment..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to check if file exists and ask for overwrite
check_and_create() {
    local file_path="$1"
    local content="$2"
    
    if [ -f "$file_path" ]; then
        echo -e "${YELLOW}⚠️  $file_path already exists${NC}"
        read -p "Do you want to overwrite it? (y/N): " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            echo -e "${BLUE}ℹ️  Skipping $file_path${NC}"
            return
        fi
    fi
    
    echo "$content" > "$file_path"
    echo -e "${GREEN}✅ Created $file_path${NC}"
}

# Backend .env
echo "📡 Setting up backend environment..."
backend_env="# TradeTaper Backend Environment Configuration
# Database Configuration
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=your_db_username
DB_PASSWORD=your_db_password
DB_DATABASE=tradetaper_dev

# Application Configuration
NODE_ENV=development
PORT=3000

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-here-make-it-long-and-random-minimum-32-characters
JWT_EXPIRATION_TIME=24h

# Stripe Configuration
STRIPE_SECRET_KEY=sk_test_your_stripe_secret_key_here
STRIPE_PUBLISHABLE_KEY=pk_test_your_stripe_publishable_key_here
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret_here

# Frontend URL for CORS
FRONTEND_URL=http://localhost:3001

# TraderMade API
TRADERMADE_API_KEY=your_tradermade_api_key_here

# Google Cloud Storage (Optional)
GCS_BUCKET_NAME=your-bucket-name
# GOOGLE_APPLICATION_CREDENTIALS=./path/to/service-account.json"

check_and_create "tradetaper-backend/.env" "$backend_env"

# Frontend .env.local
echo "🌐 Setting up frontend environment..."
frontend_env="# TradeTaper Frontend Environment Configuration
NEXT_PUBLIC_API_URL=http://localhost:3000/api/v1
NEXT_PUBLIC_BACKEND_URL=http://localhost:3000
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_your_stripe_publishable_key_here
NEXT_PUBLIC_APP_ENV=development
NEXT_PUBLIC_APP_NAME=TradeTaper
NEXT_PUBLIC_APP_VERSION=1.0.0
NEXT_PUBLIC_ENABLE_WEBSOCKETS=true
NEXT_PUBLIC_DEBUG=false"

check_and_create "tradetaper-frontend/.env.local" "$frontend_env"

# Admin .env.local
echo "🏛️ Setting up admin dashboard environment..."
admin_env="# TradeTaper Admin Dashboard Environment Configuration
NEXT_PUBLIC_API_URL=http://localhost:3000/api/v1
NEXT_PUBLIC_APP_NAME=TradeTaper Admin Dashboard
NEXT_PUBLIC_APP_VERSION=1.0.0
NEXT_PUBLIC_DASHBOARD_REFRESH_INTERVAL=30
NEXT_PUBLIC_ENABLE_REALTIME=true
NEXT_PUBLIC_DEBUG=false"

check_and_create "tradetaper-admin/.env.local" "$admin_env"

echo ""
echo -e "${GREEN}🎉 Environment setup complete!${NC}"
echo ""
echo -e "${BLUE}📋 Next steps:${NC}"
echo "1. Update database credentials in tradetaper-backend/.env"
echo "2. Add your Stripe keys to both backend and frontend .env files"
echo "3. Run 'chmod +x start-dev-all.sh' to make the start script executable"
echo "4. Run './start-dev-all.sh' to start all services"
echo ""
echo -e "${BLUE}🚀 Port Configuration:${NC}"
echo "   Backend: http://localhost:3000"
echo "   Frontend: http://localhost:3001"
echo "   Admin: http://localhost:3002"
echo ""
echo -e "${YELLOW}⚠️  Remember to:${NC}"
echo "   - Never commit real API keys to git"
echo "   - Use test Stripe keys for development"
echo "   - Set up your database before starting the backend" 