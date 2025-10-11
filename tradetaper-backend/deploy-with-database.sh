#!/bin/bash

# 🚀 Complete Cloud Run Deployment with Cloud SQL
# This script creates all necessary GCP resources and deploys the application

set -e  # Exit on error

PROJECT_ID="cenithos"
REGION="us-central1"
SERVICE_NAME="tradetaper-backend"
SQL_INSTANCE_NAME="tradetaper-db"
DATABASE_NAME="tradetaper"
DATABASE_USER="tradetaper"
DATABASE_PASSWORD="$(openssl rand -base64 32 | tr -d /=+ | cut -c1-32)"  # Generate secure password

echo "🚀 TradeTaper Complete Deployment to Cloud Run"
echo "=============================================="
echo ""

# Set project
echo "📋 Setting GCP project to: ${PROJECT_ID}"
gcloud config set project ${PROJECT_ID}

# Check if Cloud SQL instance exists
echo ""
echo "🔍 Checking for existing Cloud SQL instance..."
if gcloud sql instances describe ${SQL_INSTANCE_NAME} --project=${PROJECT_ID} 2>/dev/null; then
    echo "✅ Cloud SQL instance '${SQL_INSTANCE_NAME}' already exists"
    SQL_EXISTS=true
else
    echo "📦 Creating Cloud SQL instance (this takes 5-10 minutes)..."
    SQL_EXISTS=false
    
    gcloud sql instances create ${SQL_INSTANCE_NAME} \
        --project=${PROJECT_ID} \
        --database-version=POSTGRES_15 \
        --tier=db-f1-micro \
        --region=${REGION} \
        --root-password="${DATABASE_PASSWORD}" \
        --storage-type=SSD \
        --storage-size=10GB \
        --storage-auto-increase \
        --backup-start-time=03:00 \
        --maintenance-window-day=SUN \
        --maintenance-window-hour=04 \
        --no-assign-ip \
        --network=default
    
    echo "✅ Cloud SQL instance created!"
    
    # Create database
    echo "📊 Creating database..."
    gcloud sql databases create ${DATABASE_NAME} \
        --instance=${SQL_INSTANCE_NAME} \
        --project=${PROJECT_ID}
    
    # Create user
    echo "👤 Creating database user..."
    gcloud sql users create ${DATABASE_USER} \
        --instance=${SQL_INSTANCE_NAME} \
        --password="${DATABASE_PASSWORD}" \
        --project=${PROJECT_ID}
    
    echo "✅ Database and user created!"
fi

# Get Cloud SQL connection name
INSTANCE_CONNECTION_NAME=$(gcloud sql instances describe ${SQL_INSTANCE_NAME} \
    --project=${PROJECT_ID} \
    --format='value(connectionName)')

echo "🔗 Connection name: ${INSTANCE_CONNECTION_NAME}"

# Build container image
echo ""
echo "🏗️ Building container image..."
gcloud builds submit --tag gcr.io/${PROJECT_ID}/${SERVICE_NAME}:latest .

if [ $? -ne 0 ]; then
    echo "❌ Build failed!"
    exit 1
fi

echo "✅ Build successful!"

# Deploy to Cloud Run with Cloud SQL connection
echo ""
echo "🚀 Deploying to Cloud Run with Cloud SQL..."

gcloud run deploy ${SERVICE_NAME} \
  --image gcr.io/${PROJECT_ID}/${SERVICE_NAME}:latest \
  --region ${REGION} \
  --allow-unauthenticated \
  --memory 1Gi \
  --cpu 1 \
  --timeout 900 \
  --concurrency 80 \
  --min-instances 0 \
  --max-instances 5 \
  --add-cloudsql-instances ${INSTANCE_CONNECTION_NAME} \
  --set-env-vars "NODE_ENV=production" \
  --set-env-vars "INSTANCE_CONNECTION_NAME=${INSTANCE_CONNECTION_NAME}" \
  --set-env-vars "DB_HOST=/cloudsql/${INSTANCE_CONNECTION_NAME}" \
  --set-env-vars "DB_NAME=${DATABASE_NAME}" \
  --set-env-vars "DB_USER=${DATABASE_USER}" \
  --set-env-vars "DB_PASSWORD=${DATABASE_PASSWORD}" \
  --set-env-vars "JWT_SECRET=$(openssl rand -hex 64)" \
  --set-env-vars "GEMINI_API_KEY=${GEMINI_API_KEY}" \
  --set-env-vars "GLOBAL_PREFIX=api/v1" \
  --set-env-vars "FRONTEND_URL=https://tradetaper.vercel.app" \
  --port 8080

if [ $? -eq 0 ]; then
    echo ""
    echo "🎉 DEPLOYMENT SUCCESSFUL!"
    echo "========================="
    echo ""
    SERVICE_URL=$(gcloud run services describe ${SERVICE_NAME} --region ${REGION} --format 'value(status.url)')
    echo "🌐 Service URL: ${SERVICE_URL}"
    echo "🏥 Health Check: ${SERVICE_URL}/health"
    echo "📡 API Base: ${SERVICE_URL}/api/v1"
    echo ""
    echo "💾 Database Connection:"
    echo "   Instance: ${INSTANCE_CONNECTION_NAME}"
    echo "   Database: ${DATABASE_NAME}"
    echo "   User: ${DATABASE_USER}"
    if [ "$SQL_EXISTS" = false ]; then
        echo "   Password: ${DATABASE_PASSWORD}"
        echo "   ⚠️  SAVE THIS PASSWORD - it won't be shown again!"
    fi
    echo ""
    echo "🧪 Test the deployment:"
    echo "   curl ${SERVICE_URL}/health"
    echo ""
else
    echo "❌ Deployment failed!"
    exit 1
fi

