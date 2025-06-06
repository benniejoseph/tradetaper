#!/bin/bash

# TradeTaper Environment Verification Script
# This script checks if the environment setup is correct

echo "🔍 Verifying TradeTaper Environment Setup..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Track overall status
ALL_GOOD=true

# Function to check file existence
check_file() {
    local file_path="$1"
    local description="$2"
    
    if [ -f "$file_path" ]; then
        echo -e "${GREEN}✅ $description exists${NC}"
    else
        echo -e "${RED}❌ $description missing${NC}"
        ALL_GOOD=false
    fi
}

# Function to check if a value exists in file
check_env_var() {
    local file_path="$1"
    local var_name="$2"
    local description="$3"
    
    if [ -f "$file_path" ] && grep -q "^${var_name}=" "$file_path"; then
        echo -e "${GREEN}✅ $description configured${NC}"
    else
        echo -e "${YELLOW}⚠️  $description not configured${NC}"
    fi
}

echo -e "${BLUE}📁 Checking environment files...${NC}"

# Check environment files
check_file "tradetaper-backend/.env" "Backend environment file"
check_file "tradetaper-frontend/.env.local" "Frontend environment file"
check_file "tradetaper-admin/.env.local" "Admin environment file"

echo ""
echo -e "${BLUE}📋 Checking example files...${NC}"

# Check example files
check_file "tradetaper-backend/env.example" "Backend env.example"
check_file "tradetaper-frontend/env.example" "Frontend env.example"
check_file "tradetaper-admin/.env.example" "Admin .env.example"

echo ""
echo -e "${BLUE}🔧 Checking configuration values...${NC}"

# Check backend configuration
if [ -f "tradetaper-backend/.env" ]; then
    check_env_var "tradetaper-backend/.env" "NODE_ENV" "Backend NODE_ENV"
    check_env_var "tradetaper-backend/.env" "PORT" "Backend PORT"
    check_env_var "tradetaper-backend/.env" "JWT_SECRET" "Backend JWT_SECRET"
    check_env_var "tradetaper-backend/.env" "DB_HOST" "Database configuration"
    check_env_var "tradetaper-backend/.env" "FRONTEND_URL" "Frontend URL for CORS"
fi

# Check frontend configuration
if [ -f "tradetaper-frontend/.env.local" ]; then
    check_env_var "tradetaper-frontend/.env.local" "NEXT_PUBLIC_API_URL" "Frontend API URL"
    check_env_var "tradetaper-frontend/.env.local" "NEXT_PUBLIC_BACKEND_URL" "Frontend Backend URL"
fi

# Check admin configuration
if [ -f "tradetaper-admin/.env.local" ]; then
    check_env_var "tradetaper-admin/.env.local" "NEXT_PUBLIC_API_URL" "Admin API URL"
fi

echo ""
echo -e "${BLUE}📦 Checking package.json port configuration...${NC}"

# Check frontend port configuration
if grep -q '"dev": "next dev -p 3001"' tradetaper-frontend/package.json; then
    echo -e "${GREEN}✅ Frontend configured for port 3001${NC}"
else
    echo -e "${RED}❌ Frontend port configuration incorrect${NC}"
    ALL_GOOD=false
fi

# Check admin port configuration
if grep -q '"dev": "next dev -p 3002' tradetaper-admin/package.json; then
    echo -e "${GREEN}✅ Admin configured for port 3002${NC}"
else
    echo -e "${RED}❌ Admin port configuration incorrect${NC}"
    ALL_GOOD=false
fi

echo ""
echo -e "${BLUE}🌐 Checking for hardcoded URLs in code...${NC}"

# Check for hardcoded Railway URLs in main code files
if ! grep -r "tradetaper-backend-production.up.railway.app" tradetaper-admin/src/ tradetaper-frontend/src/ 2>/dev/null; then
    echo -e "${GREEN}✅ No hardcoded production URLs found in code${NC}"
else
    echo -e "${YELLOW}⚠️  Found hardcoded production URLs - these should use environment variables${NC}"
fi

echo ""
echo -e "${BLUE}🛠️ Checking Next.js configurations...${NC}"

# Check frontend next.config.js
if grep -q "NEXT_PUBLIC_API_URL.*localhost:3000/api/v1" tradetaper-frontend/next.config.js; then
    echo -e "${GREEN}✅ Frontend Next.js config has correct API URL default${NC}"
else
    echo -e "${RED}❌ Frontend Next.js config API URL default incorrect${NC}"
    ALL_GOOD=false
fi

# Check admin next.config.ts
if grep -q "NEXT_PUBLIC_API_URL.*localhost:3000/api/v1" tradetaper-admin/next.config.ts; then
    echo -e "${GREEN}✅ Admin Next.js config has correct API URL default${NC}"
else
    echo -e "${RED}❌ Admin Next.js config API URL default incorrect${NC}"
    ALL_GOOD=false
fi

echo ""
echo -e "${BLUE}📝 Checking development scripts...${NC}"

# Check if scripts are executable
if [ -x "setup-dev-env.sh" ]; then
    echo -e "${GREEN}✅ setup-dev-env.sh is executable${NC}"
else
    echo -e "${YELLOW}⚠️  setup-dev-env.sh not executable (run: chmod +x setup-dev-env.sh)${NC}"
fi

if [ -x "start-dev-all.sh" ]; then
    echo -e "${GREEN}✅ start-dev-all.sh is executable${NC}"
else
    echo -e "${YELLOW}⚠️  start-dev-all.sh not executable (run: chmod +x start-dev-all.sh)${NC}"
fi

echo ""
echo "=============================================="

if [ "$ALL_GOOD" = true ]; then
    echo -e "${GREEN}🎉 All environment configuration checks passed!${NC}"
    echo ""
    echo -e "${BLUE}📋 Next steps:${NC}"
    echo "1. Update database credentials in tradetaper-backend/.env"
    echo "2. Add your Stripe API keys"
    echo "3. Run ./start-dev-all.sh to start all services"
    echo ""
    echo -e "${BLUE}🚀 Port mapping:${NC}"
    echo "   Backend: http://localhost:3000"
    echo "   Frontend: http://localhost:3001"
    echo "   Admin: http://localhost:3002"
else
    echo -e "${RED}❌ Some configuration issues found. Please fix them before proceeding.${NC}"
    echo ""
    echo -e "${YELLOW}💡 Common fixes:${NC}"
    echo "   - Run ./setup-dev-env.sh to create missing env files"
    echo "   - Check that all required environment variables are set"
    echo "   - Ensure package.json scripts have correct ports"
fi

echo "==============================================" 