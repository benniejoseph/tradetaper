#!/bin/bash

# TradeTaper Backend - Google Cloud Platform Deployment Script
set -e

echo "🚀 Starting TradeTaper Backend deployment to Google Cloud Platform..."

# Configuration
PROJECT_ID=${1:-"tradetaper-production"}
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
gcloud sql users create $DB_USER --instance=$DB_INSTANCE_NAME --password=$DB_PASSWORD --quiet 2>/dev/null || {
    echo "User already exists, setting new password..."
    gcloud sql users set-password $DB_USER --instance=$DB_INSTANCE_NAME --password=$DB_PASSWORD
}

# Get the connection name for Cloud SQL
CONNECTION_NAME=$(gcloud sql instances describe $DB_INSTANCE_NAME --format="value(connectionName)")

echo "🔑 Database credentials:"
echo "  Connection Name: $CONNECTION_NAME"
echo "  Database: $DB_NAME"
echo "  User: $DB_USER"
echo "  Password: $DB_PASSWORD"

# Build and deploy to Cloud Run
echo "🏗️  Building and deploying backend to Cloud Run..."
cd tradetaper-backend

# Submit build to Cloud Build
gcloud builds submit --config=cloudbuild.yaml --substitutions=_DATABASE_URL="postgresql://$DB_USER:$DB_PASSWORD@localhost:5432/$DB_NAME?host=/cloudsql/$CONNECTION_NAME"

# Deploy to Cloud Run with Cloud SQL connection
gcloud run deploy $SERVICE_NAME \
    --image gcr.io/$PROJECT_ID/tradetaper-backend:latest \
    --region $REGION \
    --platform managed \
    --allow-unauthenticated \
    --memory 1Gi \
    --cpu 1 \
    --max-instances 10 \
    --timeout 900 \
    --add-cloudsql-instances $CONNECTION_NAME \
    --set-env-vars "NODE_ENV=production,DATABASE_URL=postgresql://$DB_USER:$DB_PASSWORD@localhost:5432/$DB_NAME?host=/cloudsql/$CONNECTION_NAME,PORT=8080"

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