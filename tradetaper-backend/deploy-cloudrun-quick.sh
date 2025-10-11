#!/bin/bash

# 🚀 Quick Cloud Run Deployment (No Database Required for Initial Deployment)
# This deploys the multi-agent system without database dependency

set -e

PROJECT_ID="cenithos"
SERVICE_NAME="tradetaper-backend"
REGION="us-central1"

echo "🚀 Quick Deploy: TradeTaper Backend to Cloud Run"
echo "================================================"
echo ""

# Set project
gcloud config set project ${PROJECT_ID}

# Build container image
echo "🏗️ Building container image..."
gcloud builds submit --tag gcr.io/${PROJECT_ID}/${SERVICE_NAME}:latest .

if [ $? -ne 0 ]; then
    echo "❌ Build failed!"
    exit 1
fi

echo "✅ Build successful!"

# Deploy to Cloud Run WITHOUT database (for quick testing)
echo ""
echo "🚀 Deploying to Cloud Run (API-only mode)..."

gcloud run deploy ${SERVICE_NAME} \
  --image gcr.io/${PROJECT_ID}/${SERVICE_NAME}:latest \
  --region ${REGION} \
  --allow-unauthenticated \
  --memory 1Gi \
  --cpu 1 \
  --timeout 300 \
  --concurrency 80 \
  --min-instances 0 \
  --max-instances 5 \
  --set-env-vars "NODE_ENV=development" \
  --set-env-vars "DB_HOST=localhost" \
  --set-env-vars "DB_PORT=5432" \
  --set-env-vars "DB_NAME=tradetaper" \
  --set-env-vars "DB_USERNAME=postgres" \
  --set-env-vars "DB_PASSWORD=temp123" \
  --set-env-vars "JWT_SECRET=$(openssl rand -hex 64)" \
  --set-env-vars "GEMINI_API_KEY=${GEMINI_API_KEY:-AIzaSyAWQxWu9kFxhWZ7Kkj3bVvD2u1iQ9NxYrM}" \
  --set-env-vars "GLOBAL_PREFIX=api/v1" \
  --set-env-vars "FRONTEND_URL=https://tradetaper.vercel.app" \
  --port 8080

if [ $? -eq 0 ]; then
    echo ""
    echo "🎉 QUICK DEPLOYMENT SUCCESSFUL!"
    echo "==============================="
    echo ""
    SERVICE_URL=$(gcloud run services describe ${SERVICE_NAME} --region ${REGION} --format 'value(status.url)')
    echo "🌐 Service URL: ${SERVICE_URL}"
    echo "🏥 Health Check: ${SERVICE_URL}/health"
    echo "📡 API Base: ${SERVICE_URL}/api/v1"
    echo ""
    echo "✨ Multi-Agent System Features Available:"
    echo "   ✅ Agent Registry"
    echo "   ✅ Message Bus"
    echo "   ✅ LLM Cost Management"
    echo "   ✅ Semantic Caching"
    echo "   ✅ Multi-Model Orchestration"
    echo "   ✅ Consensus Mechanisms"
    echo ""
    echo "⚠️  Note: Database features disabled for quick deployment"
    echo "   To enable full features with database, run: ./deploy-with-database.sh"
    echo ""
    echo "🧪 Test the multi-agent system:"
    echo "   curl ${SERVICE_URL}/health"
    echo ""
else
    echo "❌ Deployment failed!"
    exit 1
fi

