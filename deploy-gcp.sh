#!/bin/bash

# TradeTaper Backend - Google Cloud Platform Deployment Script
set -e

echo "🚀 Starting TradeTaper Backend deployment to Google Cloud Platform..."

# Configuration
PROJECT_ID=${1:-"tradetaper"}
REGION="us-central1"
SERVICE_NAME="tradetaper-backend"
DB_INSTANCE_NAME="tradetaper-postgres"
DB_NAME="tradetaper"
DB_USER="tradetaper"

echo "📋 Configuration:"
echo "  Project ID: $PROJECT_ID"
echo "  Region: $REGION"
echo "  Service: $SERVICE_NAME"
echo "  Database: $DB_INSTANCE_NAME"

# Check if gcloud is installed
if ! command -v gcloud &> /dev/null; then
    echo "❌ Google Cloud SDK not found. Please install it first:"
    echo "   https://cloud.google.com/sdk/docs/install"
    exit 1
fi

# Set project
echo "🔧 Setting up Google Cloud project..."
gcloud config set project $PROJECT_ID

# Enable required APIs
echo "🔌 Enabling required Google Cloud APIs..."
gcloud services enable run.googleapis.com
gcloud services enable cloudbuild.googleapis.com
gcloud services enable sql-component.googleapis.com
gcloud services enable sqladmin.googleapis.com

# Create Cloud SQL PostgreSQL instance if it doesn't exist
echo "🗄️  Setting up Cloud SQL PostgreSQL database..."
if ! gcloud sql instances describe $DB_INSTANCE_NAME --quiet 2>/dev/null; then
    echo "Creating new Cloud SQL instance..."
    gcloud sql instances create $DB_INSTANCE_NAME \
        --database-version=POSTGRES_15 \
        --tier=db-f1-micro \
        --region=$REGION \
        --storage-type=SSD \
        --storage-size=10GB \
        --storage-auto-increase \
        --backup-start-time=03:00 \
        --maintenance-release-channel=production \
        --maintenance-window-day=SUN \
        --maintenance-window-hour=04 \
        --deletion-protection
    
    echo "⏳ Waiting for Cloud SQL instance to be ready..."
    gcloud sql operations wait $(gcloud sql operations list --instance=$DB_INSTANCE_NAME --limit=1 --format="value(name)") --quiet
else
    echo "✅ Cloud SQL instance already exists"
fi

# Create database and user
echo "👤 Setting up database and user..."
gcloud sql databases create $DB_NAME --instance=$DB_INSTANCE_NAME --quiet 2>/dev/null || echo "Database already exists"

# Generate random password for database user
DB_PASSWORD=$(openssl rand -base64 32)
gcloud sql users set-password $DB_USER --instance=$DB_INSTANCE_NAME --password=$DB_PASSWORD

# Get the connection name for Cloud SQL
CONNECTION_NAME=$(gcloud sql instances describe $DB_INSTANCE_NAME --format="value(connectionName)")

# Get the public IP address of the Cloud SQL instance
DB_HOST=$(gcloud sql instances describe $DB_INSTANCE_NAME --format="value(ipAddresses[0].ipAddress)")

# Grant Cloud SQL Client role to the service account
gcloud projects add-iam-policy-binding $PROJECT_ID \
    --member="serviceAccount:tradetaper-backend-sa@$PROJECT_ID.iam.gserviceaccount.com" \
    --role="roles/cloudsql.client"

# Configure Cloud SQL to accept all connections (for testing)
gcloud sql instances patch $DB_INSTANCE_NAME --authorized-networks=0.0.0.0/0

echo "🔑 Database credentials:"
echo "  Connection Name: $CONNECTION_NAME"
echo "  Database: $DB_NAME"
echo "  User: $DB_USER"
echo "  Password: $DB_PASSWORD"

# Build and deploy to Cloud Run
echo "🏗️  Building and deploying backend to Cloud Run..."
cd tradetaper-backend

# Submit build to Cloud Build
gcloud builds submit --config=cloudbuild.yaml

# Deploy to Cloud Run with Cloud SQL connection
echo "🐛 Debug: About to run the following gcloud run deploy command:"
gcloud run deploy $SERVICE_NAME \
    --image gcr.io/$PROJECT_ID/tradetaper-backend:latest \
    --region $REGION \
    --platform managed \
    --allow-unauthenticated \
    --memory 1Gi \
    --cpu 1 \
    --max-instances 10 \
    --timeout 900 \
    --service-account="tradetaper-backend-sa@$PROJECT_ID.iam.gserviceaccount.com" \
    --set-env-vars="NODE_ENV=production,DATABASE_HOST=$DB_HOST,DATABASE_PORT=5432,DATABASE_USERNAME=tradetaper,DATABASE_PASSWORD=$DB_PASSWORD,DATABASE_NAME=tradetaper,JWT_SECRET=<YOUR_JWT_SECRET>,FRONTEND_URL=<YOUR_FRONTEND_URL>,ADMIN_URL=<YOUR_ADMIN_URL>,GCS_BUCKET_NAME=<YOUR_GCS_BUCKET_NAME>,TRADERMADE_API_KEY=<YOUR_TRADERMADE_API_KEY>,GEMINI_API_KEY=<YOUR_GEMINI_API_KEY>,GOOGLE_CLOUD_PROJECT_ID=$PROJECT_ID,FORCE_SEED=false,DEBUG=false,GOOGLE_CLIENT_ID=<YOUR_GOOGLE_CLIENT_ID>,GOOGLE_CLIENT_SECRET=<YOUR_GOOGLE_CLIENT_SECRET>,GOOGLE_CALLBACK_URL=<YOUR_GOOGLE_CALLBACK_URL>"

# Get the service URL
SERVICE_URL=$(gcloud run services describe $SERVICE_NAME --region $REGION --format="value(status.url)")

echo "✅ Deployment completed successfully!"
echo ""
echo "🌐 Backend URL: $SERVICE_URL"
echo "🗄️  Database Connection: $CONNECTION_NAME"
echo ""
echo "🔧 Next steps:"
echo "1. Update frontend environment variables:"
echo "   NEXT_PUBLIC_API_URL=$SERVICE_URL/api/v1"
echo ""
echo "2. Test the deployment:"
echo "   curl $SERVICE_URL/health"
echo "   curl $SERVICE_URL/api/v1/health"
echo ""
echo "3. Update admin dashboard configuration with new backend URL"

cd ..