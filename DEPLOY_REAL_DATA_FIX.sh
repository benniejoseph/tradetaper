#!/bin/bash

# TradeTaper Backend - Real Data Fix Deployment
# This script deploys the backend with XAUUSD real data fixes

set -e  # Exit on error

echo "=================================================="
echo "🚀 TradeTaper Backend - Real Data Fix Deployment"
echo "=================================================="
echo ""

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Navigate to backend directory
echo -e "${BLUE}📂 Navigating to backend directory...${NC}"
cd "$(dirname "$0")/tradetaper-backend"

# Show what we're fixing
echo ""
echo -e "${YELLOW}🔧 Fixes being deployed:${NC}"
echo "  ✅ Updated XAUUSD fallback price: 2030.50 → 4107.00"
echo "  ✅ Updated XAUUSD base price in TradingView: 2660.50 → 4107.00"
echo "  ✅ Added commodity classification for XAUUSD"
echo "  ✅ Mapped XAUUSD to Yahoo Finance (GC=F)"
echo "  ✅ Removed XAUUSD from forex classification"
echo "  ✅ Routes commodities to Yahoo Finance (FREE)"
echo ""

# Confirm deployment
read -p "🚀 Ready to deploy? (y/N): " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]
then
    echo "❌ Deployment cancelled"
    exit 1
fi

# Build Docker image
echo ""
echo -e "${BLUE}🐳 Building Docker image...${NC}"
gcloud builds submit --tag gcr.io/tradetaper-backend/tradetaper-backend:latest

if [ $? -ne 0 ]; then
    echo -e "${YELLOW}❌ Docker build failed${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Docker image built successfully${NC}"

# Deploy to Cloud Run
echo ""
echo -e "${BLUE}☁️  Deploying to Cloud Run...${NC}"
gcloud run deploy tradetaper-backend \
  --image gcr.io/tradetaper-backend/tradetaper-backend:latest \
  --platform managed \
  --region us-central1 \
  --env-vars-file env-vars.yaml \
  --allow-unauthenticated

if [ $? -ne 0 ]; then
    echo -e "${YELLOW}❌ Cloud Run deployment failed${NC}"
    exit 1
fi

echo ""
echo -e "${GREEN}✅ Backend deployed successfully!${NC}"

# Test the deployment
echo ""
echo -e "${BLUE}🧪 Testing XAUUSD data...${NC}"
echo ""

BACKEND_URL="https://tradetaper-backend-326520250422.us-central1.run.app"

echo "Testing Premium/Discount endpoint:"
curl -s "${BACKEND_URL}/api/v1/ict/premium-discount/XAUUSD?timeframe=1H" | jq '.data.currentPrice' || echo "Could not parse response"

echo ""
echo "Testing Power of Three endpoint:"
curl -s "${BACKEND_URL}/api/v1/ict/power-of-three/XAUUSD?timeframe=1H" | jq '.data.currentPhase' || echo "Could not parse response"

echo ""
echo "Testing Kill Zones endpoint:"
curl -s "${BACKEND_URL}/api/v1/ict/kill-zones" | jq '.data.currentZone' || echo "Could not parse response"

echo ""
echo -e "${GREEN}=================================================="
echo "✅ Deployment Complete!"
echo "==================================================${NC}"
echo ""
echo "📊 Next steps:"
echo "  1. Open http://localhost:3000/dashboard"
echo "  2. Check Premium/Discount widget for XAUUSD"
echo "  3. Verify price shows ~4107 (not 2030)"
echo ""
echo "🔗 Backend URL:"
echo "  ${BACKEND_URL}"
echo ""
echo "📝 Test endpoints:"
echo "  ${BACKEND_URL}/api/v1/ict/premium-discount/XAUUSD?timeframe=1H"
echo "  ${BACKEND_URL}/api/v1/ict/power-of-three/XAUUSD?timeframe=1H"
echo "  ${BACKEND_URL}/api/v1/ict/kill-zones"
echo ""

