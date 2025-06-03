#!/bin/bash

# TradeTaper Development Startup Script
# This script starts both backend and frontend for development testing

echo "🚀 Starting TradeTaper Development Environment..."

# Function to kill background processes on script exit
cleanup() {
    echo "🛑 Stopping servers..."
    jobs -p | xargs -r kill 2>/dev/null
    exit 0
}

# Set up signal handlers
trap cleanup SIGINT SIGTERM

# Start backend server
echo "📡 Starting Backend Server..."
cd tradetaper-backend
npm run start:dev &
BACKEND_PID=$!

# Wait a moment for backend to start
sleep 3

# Start frontend server
echo "🌐 Starting Frontend Server..."
cd ../tradetaper-frontend
npm run dev &
FRONTEND_PID=$!

echo ""
echo "✅ Development servers starting..."
echo "📡 Backend: http://localhost:3000"
echo "🌐 Frontend: http://localhost:3001"
echo ""
echo "🧪 To test image upload:"
echo "1. Navigate to http://localhost:3001/journal/new"
echo "2. Fill out the trade form"
echo "3. Upload an image in the 'Chart Snapshot' section"
echo "4. Submit the form to test GCP bucket storage"
echo ""
echo "Press Ctrl+C to stop all servers"

# Wait for both processes
wait $BACKEND_PID $FRONTEND_PID 