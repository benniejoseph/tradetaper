#!/bin/bash
set -e

PROJECT_ID="trade-taper"
SERVICE_NAME="tradetaper-backend"
REGION="us-central1"
INSTANCE_CONNECTION_NAME="trade-taper:us-central1:trade-taper-postgres"

echo "🚀 Deploying TradeTaper Backend to trade-taper project..."

# Set project
gcloud config set project ${PROJECT_ID}

# Build container
echo "🏗️ Building container image..."
gcloud builds submit --tag gcr.io/${PROJECT_ID}/${SERVICE_NAME}:latest .

if [ $? -ne 0 ]; then
    echo "❌ Build failed!"
    exit 1
fi

echo "✅ Build successful!"

# Deploy to Cloud Run
echo "🚀 Deploying to Cloud Run..."
gcloud run deploy ${SERVICE_NAME} \
  --image gcr.io/${PROJECT_ID}/${SERVICE_NAME}:latest \
  --region ${REGION} \
  --allow-unauthenticated \
  --memory 2Gi \
  --cpu 2 \
  --timeout 900 \
  --concurrency 80 \
  --min-instances 0 \
  --max-instances 5 \
  --add-cloudsql-instances ${INSTANCE_CONNECTION_NAME} \
  --port 8080 \
  --project ${PROJECT_ID}

echo ""
echo "🎉 DEPLOYMENT COMPLETE!"
SERVICE_URL=$(gcloud run services describe ${SERVICE_NAME} --region ${REGION} --project ${PROJECT_ID} --format='value(status.url)')
echo "🌐 Service URL: ${SERVICE_URL}"
echo "🏥 Health: ${SERVICE_URL}/api/v1/health"
