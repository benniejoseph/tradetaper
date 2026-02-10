#!/bin/bash

# 🚀 Deploy TradeTaper Backend to Cloud Run (trade-taper project)

PROJECT_ID="trade-taper"
SERVICE_NAME="tradetaper-backend"
REGION="us-central1"
INSTANCE_CONNECTION_NAME="trade-taper:us-central1:trade-taper-postgres"
IMAGE_URL="${REGION}-docker.pkg.dev/${PROJECT_ID}/${SERVICE_NAME}/${SERVICE_NAME}:latest"

echo "🚀 Deploying TradeTaper Backend to Cloud Run..."
echo "📦 Project: ${PROJECT_ID}"
echo "🌍 Region: ${REGION}"
echo "🐳 Image: ${IMAGE_URL}"
echo ""

# Set the project
gcloud config set project ${PROJECT_ID}

# Build and push container image to Artifact Registry
echo "🏗️ Building container image..."
gcloud builds submit --tag ${IMAGE_URL} .

if [ $? -ne 0 ]; then
    echo "❌ Build failed. Please check the logs above."
    exit 1
fi

echo "✅ Build successful!"

# Deploy to Cloud Run with ICT system
echo "🚀 Deploying to Cloud Run..."
gcloud run deploy ${SERVICE_NAME} \
  --image ${IMAGE_URL} \
  --region ${REGION} \
  --allow-unauthenticated \
  --memory 2Gi \
  --cpu 2 \
  --timeout 900 \
  --concurrency 80 \
  --min-instances 0 \
  --max-instances 5 \
  --cpu-boost \
  --vpc-connector trade-taper-connector \
  --vpc-egress private-ranges-only \
  --set-secrets=GOOGLE_APPLICATION_CREDENTIALS=firebase-adminsdk:latest \
  --env-vars-file env-vars.yaml

if [ $? -eq 0 ]; then
    echo ""
    echo "🎉 CLOUD RUN DEPLOYMENT SUCCESSFUL!"
    echo ""
    SERVICE_URL=$(gcloud run services describe ${SERVICE_NAME} --region ${REGION} --format 'value(status.url)')
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo ""
    echo "🌐 Backend URL: ${SERVICE_URL}"
    echo "🏥 Health Check: ${SERVICE_URL}/health"
    echo "📡 API Base: ${SERVICE_URL}/api/v1"
    echo ""
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo ""
    echo "✅ ICT TRADING SYSTEM DEPLOYED!"
    echo ""
    echo "📸 Chart Image Analysis: ${SERVICE_URL}/api/v1/ict/analyze-charts"
    echo "🤖 ICT AI Agent: ${SERVICE_URL}/api/v1/ict/ai-analysis"
    echo "💰 Premium/Discount: ${SERVICE_URL}/api/v1/ict/premium-discount"
    echo "⚡ Power of Three: ${SERVICE_URL}/api/v1/ict/power-of-three"
    echo "🏛️ Order Blocks: ${SERVICE_URL}/api/v1/ict/order-blocks"
    echo "📊 Fair Value Gaps: ${SERVICE_URL}/api/v1/ict/fair-value-gaps"
    echo "🕐 Kill Zones: ${SERVICE_URL}/api/v1/ict/kill-zones"
    echo ""
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo ""
    echo "🧪 Test the deployment:"
    echo "   curl ${SERVICE_URL}/health"
    echo "   curl ${SERVICE_URL}/api/v1/market-intelligence/public/status"
    echo ""
else
    echo "❌ Cloud Run deployment failed!"
    exit 1
fi
