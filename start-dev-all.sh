#!/bin/bash

# TradeTaper Complete Development Startup Script
# This script starts backend, frontend, and admin dashboard for development

echo "🚀 Starting TradeTaper Development Environment..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to kill background processes on script exit
cleanup() {
    echo -e "\n${YELLOW}🛑 Stopping all servers...${NC}"
    jobs -p | xargs -r kill 2>/dev/null
    echo -e "${GREEN}✅ All servers stopped${NC}"
    exit 0
}

# Set up signal handlers
trap cleanup SIGINT SIGTERM

# Check if .env files exist
echo -e "${BLUE}🔍 Checking environment files...${NC}"

if [ ! -f "tradetaper-backend/.env" ]; then
    echo -e "${RED}❌ Backend .env file not found${NC}"
    echo -e "${YELLOW}💡 Run './setup-dev-env.sh' to create environment files${NC}"
    exit 1
fi

if [ ! -f "tradetaper-frontend/.env.local" ]; then
    echo -e "${RED}❌ Frontend .env.local file not found${NC}"
    echo -e "${YELLOW}💡 Run './setup-dev-env.sh' to create environment files${NC}"
    exit 1
fi

if [ ! -f "tradetaper-admin/.env.local" ]; then
    echo -e "${RED}❌ Admin .env.local file not found${NC}"
    echo -e "${YELLOW}💡 Run './setup-dev-env.sh' to create environment files${NC}"
    exit 1
fi

echo -e "${GREEN}✅ All environment files found${NC}"

# Check if node_modules exist
echo -e "${BLUE}🔍 Checking dependencies...${NC}"

for dir in "tradetaper-backend" "tradetaper-frontend" "tradetaper-admin"; do
    if [ ! -d "$dir/node_modules" ]; then
        echo -e "${YELLOW}⚠️  Dependencies not found in $dir${NC}"
        echo -e "${BLUE}📦 Installing dependencies for $dir...${NC}"
        cd "$dir"
        npm install
        cd ..
    fi
done

echo -e "${GREEN}✅ All dependencies ready${NC}"

# Start backend server
echo -e "${BLUE}📡 Starting Backend Server (Port 3000)...${NC}"
cd tradetaper-backend
npm run start:dev &
BACKEND_PID=$!
cd ..

# Wait a moment for backend to start
sleep 5

# Start frontend server
echo -e "${BLUE}🌐 Starting Frontend Server (Port 3001)...${NC}"
cd tradetaper-frontend
npm run dev &
FRONTEND_PID=$!
cd ..

# Wait a moment for frontend to start
sleep 3

# Start admin dashboard
echo -e "${BLUE}🏛️ Starting Admin Dashboard (Port 3002)...${NC}"
cd tradetaper-admin
npm run dev &
ADMIN_PID=$!
cd ..

# Wait a moment for admin to start
sleep 3

echo ""
echo -e "${GREEN}✅ All development servers started successfully!${NC}"
echo ""
echo -e "${BLUE}🌐 Application URLs:${NC}"
echo -e "   📡 Backend API: ${GREEN}http://localhost:3000${NC}"
echo -e "   🌐 Frontend: ${GREEN}http://localhost:3001${NC}"
echo -e "   🏛️ Admin Dashboard: ${GREEN}http://localhost:3002${NC}"
echo ""
echo -e "${BLUE}🧪 Quick Test Links:${NC}"
echo -e "   📊 Frontend Trading Journal: ${GREEN}http://localhost:3001/journal/new${NC}"
echo -e "   📈 Admin Dashboard: ${GREEN}http://localhost:3002${NC}"
echo -e "   🔗 Backend Health Check: ${GREEN}http://localhost:3000/api/v1/health${NC}"
echo ""
echo -e "${BLUE}📋 Useful Commands:${NC}"
echo -e "   View backend logs: ${YELLOW}tail -f tradetaper-backend/backend.log${NC}"
echo -e "   Test API endpoints: ${YELLOW}curl http://localhost:3000/api/v1/health${NC}"
echo ""
echo -e "${YELLOW}⚠️  Important Notes:${NC}"
echo -e "   - Make sure your database is running and configured"
echo -e "   - Update Stripe keys in .env files for payment testing"
echo -e "   - Admin dashboard requires backend to be running"
echo ""
echo -e "${RED}Press Ctrl+C to stop all servers${NC}"

# Wait for all processes
wait $BACKEND_PID $FRONTEND_PID $ADMIN_PID 