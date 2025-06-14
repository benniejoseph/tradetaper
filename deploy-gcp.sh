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
gcloud builds submit --config=cloudbuild.yaml

# Deploy to Cloud Run with Cloud SQL connection
echo "🐛 Debug: About to run the following gcloud run deploy command:"
echo "gcloud run deploy $SERVICE_NAME \
    --image gcr.io/$PROJECT_ID/tradetaper-backend:latest \
    --region $REGION \
    --platform managed \
    --allow-unauthenticated \
    --memory 1Gi \
    --cpu 1 \
    --max-instances 10 \
    --timeout 900 \
    --add-cloudsql-instances $CONNECTION_NAME \
    --set-env-vars \"NODE_ENV=production,DATABASE_URL=postgresql://$DB_USER:$DB_PASSWORD@/$DB_NAME?host=/cloudsql/$CONNECTION_NAME,METAAPI_API_TOKEN=eyJhbGciOiJSUzUxMiIsInR5cCI6IkpXVCJ9.eyJfaWQiOiI4Yjc1MzE2NGU5NDAyMzg4NzE1MjczNmI5ZjEzNTc1MSIsImFjY2Vzc1J1bGVzIjpbeyJpZCI6InRyYWRpbmctYWNjb3VudC1tYW5hZ2VtZW50LWFwaSIsIm1ldGhvZHMiOlsidHJhZGluZy1hY2NvdW50LW1hbmFnZW1lbnQtYXBpOnJlc3Q6cHVibGljOio6KiJdLCJyb2xlcyI6WyJyZWFkZXIiLCJ3cml0ZXIiXSwicmVzb3VyY2VzIjpbIio6JFVTRVJfSUQkOioiXX0seyJpZCI6Im1ldGFhcGktcmVzdC1hcGkiLCJtZXRob2RzIjpbIm1ldGFhcGktYXBpOnJlc3Q6cHVibGljOio6KiJdLCJyb2xlcyI6WyJyZWFkZXIiLCJ3cml0ZXIiXSwicmVzb3VyY2VzIjpbIio6JFVTRVJfSUQkOioiXX0seyJpZCI6Im1ldGFhcGktcnBjLWFwaSIsIm1ldGhvZHMiOlsibWV0YWFwaS1hcGk6d3M6cHVibGljOio6KiJdLCJyb2xlcyI6WyJyZWFkZXIiLCJ3cml0ZXIiXSwicmVzb3VyY2VzIjpbIio6JFVTRVJfSUQkOioiXX0seyJpZCI6Im1ldGFhcGktcmVhbC10aW1lLXN0cmVhbWluZy1hcGkiLCJtZXRob2RzIjpbIm1ldGFhcGktYXBpOndzOnB1YmxpYzoqOioiXSwicm9sZXMiOlsicmVhZGVyIiwid3JpdGVyIl0sInJlc291cmNlcyI6WyIqOiRVU0VSX0lEJDoqIl19LHsiaWQiOiJtZXRhc3RhdHMtYXBpIiwibWV0aG9kcyI6WyJtZXRhc3RhdHMtYXBpOnJlc3Q6cHVibGljOio6KiJdLCJyb2xlcyI6WyJyZWFkZXIiLCJ3cml0ZXIiXSwicmVzb3VyY2VzIjpbIio6JFVTRVJfSUQkOioiXX0seyJpZCI6InJpc2stbWFuYWdlbWVudC1hcGkiLCJtZXRob2RzIjpbInJpc2stbWFuYWdlbWVudC1hcGk6cmVzdDpwdWJsaWM6KjoqIl0sInJvbGVzIjpbInJlYWRlciIsIndyaXRlciJdLCJyZXNvdXJjZXMiOlsiKjokVVNFUl9JRCQ6KiJdfSx7ImlkIjoiY29weWZhY3RvcnktYXBpIiwibWV0aG9kcyI6WyJjb3B5ZmFjdG9yeS1hcGk6cmVzdDpwdWJsaWM6KjoqIl0sInJvbGVzIjpbInJlYWRlciIsIndyaXRlciJdLCJyZXNvdXJjZXMiOlsiKjokVVNFUl9JRCQ6KiJdfSx7ImlkIjoibXQtbWFuYWdlci1hcGkiLCJtZXRob2RzIjpbIm10LW1hbmFnZXItYXBpOnJlc3Q6ZGVhbGluZzoqOioiLCJtdC1tYW5hZ2VyLWFwaTpyZXN0OnB1YmxpYzoqOioiXSwicm9sZXMiOlsicmVhZGVyIiwid3JpdGVyIl0sInJlc291cmNlcyI6WyIqOiRVU0VSX0lEJDoqIl19LHsiaWQiOiJiaWxsaW5nLWFwaSIsIm1ldGhvZHMiOlsiYmlsbGluZy1hcGk6cmVzdDpwdWJsaWM6KjoqIl0sInJvbGVzIjpbInJlYWRlciJdLCJyZXNvdXJjZXMiOlsiKjokVVNFUl9JRCQ6KiJdfV0sImlnbm9yZVJhdGVMaW1pdHMiOmZhbHNlLCJ0b2tlbklkIjoiMjAyMTAyMTMiLCJpbXBlcnNvbmF0ZWQiOmZhbHNlLCJyZWFsVXNlcklkIjoiOGI3NTMxNjRlOTQwMjM4ODcxNTI3MzZiOWYxMzU3NTEiLCJpYXQiOjE3NDkxOTU0NTN9.mFJFsNxIcDVCLyEljmISNZ6MrtV-YbPOjsth2n1XIOG-XVdrPA4jMf85xej62y8UvPS2Gw5NnkhPYuEzFDxwlwtNDpJ4F61MbprFoKnpgIecBZ8BTug3COFKrPDEHZ1AVtp95EYV8cj616QBHFLAj_J1d9uut7aAqDj2Dif9wjPrjJF0V9Z1x8ZaXWuUs9k61J2Q6EpTqPc7B9-Kfwi7t2YL2QfEwTc28VE9fH40b_ZOv2FBfrvah49OgbaLIyiSAlf8b82wCc5-osFFBFgV-zqyIpt5Rdii6C8-AS5WWkLlk2DgjTauTUWtkErA6Hs5CgwE7qpRHOXB5qbM98kDlqtWcpnAKIAIWi0WG9r6vsNiHTqv1zh0sa0TZ3mPSV_LrVB7CCAzv-42FktPwmEkiaROZEu5Zl2wx3EJq21LJKHeIQTmdhV9amMvLvRCWb9z-pjOHbvfrrm5fJCdtQa9jAh-X7aW4k9qMhWVfmYwZKlVicGfn15A8GccQ6-d3v4cXsgw3hU8gJfBI3_RyJVbOs3pupR_zAqiadA2KeSK8zAgMbC1eN_91x9eUF4i9bgzZdJmUM9kg6iX7zWv7jG6Lml5H2kXbSamVjtQyr1G2hXkqab-qGQPZf4brLGOukaY_I6Y5HZFD549vtzcwGBPiXHRjT68ieuDb_F5PEpfB-8,JWT_EXPIRATION_TIME=24h,JWT_SECRET=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiYWRtaW4iOnRydWUsImlhdCI6MTUxNjIzOTAyMn0.KMUFsIDTnFmyG3nMiGM6H9FNFUROf3wh7SmqJp-QV30,METAAPI_APPLICATION=TradeTaper,METAAPI_DOMAIN=agiliumtrade.ai,METAAPI_REQUEST_TIMEOUT=60000,METAAPI_MOCK_MODE=false,METAAPI_WEBSOCKET_TIMEOUT=60,STRIPE_PRICE_STARTER_MONTHLY=price_1QH5dRJF0yiNfCnPpLYhHnDV,STRIPE_PRICE_STARTER_YEARLY=price_1QH5dRJF0yiNfCnPpLYhHnDX,STRIPE_PRICE_PROFESSIONAL_MONTHLY=price_1QH5dRJF0yiNfCnPpLYhHnDY,STRIPE_PRICE_PROFESSIONAL_YEARLY=price_1QH5dRJF0yiNfCnPpLYhHnDZ,STRIPE_PRICE_ENTERPRISE_MONTHLY=price_1QH5dRJF0yiNfCnPpLYhHnDA,STRIPE_PRICE_ENTERPRISE_YEARLY=price_1QH5dRJF0yiNfCnPpLYhHnDB,STRIPE_SECRET_KEY=sk_test_51HCsYUKCBJK5GhoVRw2fa2u59R2biPCde1MCP2IU8MSz92deeKHrD0FKAReXFeOpqWiN387NoeauU3pFCy3k18sS000AokIvgM,STRIPE_PUBLISHABLE_KEY=pk_test_51HCsYUKCBJK5GhoVW20cTDcwCJvPbGMSSU57Oo0Dfr1tVVmhXMmPJlqiFFaXW5qHjaXc7QcuIIlWzyqk8aHssZxh002dpfXexM,STRIPE_WEBHOOK_SECRET=whsec_CIuvLwdJp1FciFX08RB6nXKmXTd3ZsIV,FRONTEND_URL=https://tradetaper-frontend-benniejosephs-projects.vercel.app,TRADERMADE_API_KEY=X4FgwHzL7HpukWs4FjYV,GCS_PUBLIC_URL_PREFIX=https://storage.googleapis.com/tradetaper-bucket-images,GCS_BUCKET_NAME=tradetaper-bucket-images\""
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
    --set-env-vars "NODE_ENV=production,DATABASE_URL=postgresql://$DB_USER:$DB_PASSWORD@/$DB_NAME?host=/cloudsql/$CONNECTION_NAME,METAAPI_API_TOKEN=eyJhbGciOiJSUzUxMiIsInR5cCI6IkpXVCJ9.eyJfaWQiOiI4Yjc1MzE2NGU5NDAyMzg4NzE1MjczNmI5ZjEzNTc1MSIsImFjY2Vzc1J1bGVzIjpbeyJpZCI6InRyYWRpbmctYWNjb3VudC1tYW5hZ2VtZW50LWFwaSIsIm1ldGhvZHMiOlsidHJhZGluZy1hY2NvdW50LW1hbmFnZW1lbnQtYXBpOnJlc3Q6cHVibGljOio6KiJdLCJyb2xlcyI6WyJyZWFkZXIiLCJ3cml0ZXIiXSwicmVzb3VyY2VzIjpbIio6JFVTRVJfSUQkOioiXX0seyJpZCI6Im1ldGFhcGktcmVzdC1hcGkiLCJtZXRob2RzIjpbIm1ldGFhcGktYXBpOnJlc3Q6cHVibGljOio6KiJdLCJyb2xlcyI6WyJyZWFkZXIiLCJ3cml0ZXIiXSwicmVzb3VyY2VzIjpbIio6JFVTRVJfSUQkOioiXX0seyJpZCI6Im1ldGFhcGktcnBjLWFwaSIsIm1ldGhvZHMiOlsibWV0YWFwaS1hcGk6d3M6cHVibGljOio6KiJdLCJyb2xlcyI6WyJyZWFkZXIiLCJ3cml0ZXIiXSwicmVzb3VyY2VzIjpbIio6JFVTRVJfSUQkOioiXX0seyJpZCI6Im1ldGFhcGktcmVhbC10aW1lLXN0cmVhbWluZy1hcGkiLCJtZXRob2RzIjpbIm1ldGFhcGktYXBpOndzOnB1YmxpYzoqOioiXSwicm9sZXMiOlsicmVhZGVyIiwid3JpdGVyIl0sInJlc291cmNlcyI6WyIqOiRVU0VSX0lEJDoqIl19LHsiaWQiOiJtZXRhc3RhdHMtYXBpIiwibWV0aG9kcyI6WyJtZXRhc3RhdHMtYXBpOnJlc3Q6cHVibGljOio6KiJdLCJyb2xlcyI6WyJyZWFkZXIiLCJ3cml0ZXIiXSwicmVzb3VyY2VzIjpbIio6JFVTRVJfSUQkOioiXX0seyJpZCI6InJpc2stbWFuYWdlbWVudC1hcGkiLCJtZXRob2RzIjpbInJpc2stbWFuYWdlbWVudC1hcGk6cmVzdDpwdWJsaWM6KjoqIl0sInJvbGVzIjpbInJlYWRlciIsIndyaXRlciJdLCJyZXNvdXJjZXMiOlsiKjokVVNFUl9JRCQ6KiJdfSx7ImlkIjoiY29weWZhY3RvcnktYXBpIiwibWV0aG9kcyI6WyJjb3B5ZmFjdG9yeS1hcGk6cmVzdDpwdWJsaWM6KjoqIl0sInJvbGVzIjpbInJlYWRlciIsIndyaXRlciJdLCJyZXNvdXJjZXMiOlsiKjokVVNFUl9JRCQ6KiJdfSx7ImlkIjoibXQtbWFuYWdlci1hcGkiLCJtZXRob2RzIjpbIm10LW1hbmFnZXItYXBpOnJlc3Q6ZGVhbGluZzoqOioiLCJtdC1tYW5hZ2VyLWFwaTpyZXN0OnB1YmxpYzoqOioiXSwicm9sZXMiOlsicmVhZGVyIiwid3JpdGVyIl0sInJlc291cmNlcyI6WyIqOiRVU0VSX0lEJDoqIl19LHsiaWQiOiJiaWxsaW5nLWFwaSIsIm1ldGhvZHMiOlsiYmlsbGluZy1hcGk6cmVzdDpwdWJsaWM6KjoqIl0sInJvbGVzIjpbInJlYWRlciJdLCJyZXNvdXJjZXMiOlsiKjokVVNFUl9JRCQ6KiJdfV0sImlnbm9yZVJhdGVMaW1pdHMiOmZhbHNlLCJ0b2tlbklkIjoiMjAyMTAyMTMiLCJpbXBlcnNvbmF0ZWQiOmZhbHNlLCJyZWFsVXNlcklkIjoiOGI3NTMxNjRlOTQwMjM4ODcxNTI3MzZiOWYxMzU3NTEiLCJpYXQiOjE3NDkxOTU0NTN9.mFJFsNxIcDVCLyEljmISNZ6MrtV-YbPOjsth2n1XIOG-XVdrPA4jMf85xej62y8UvPS2Gw5NnkhPYuEzFDxwlwtNDpJ4F61MbprFoKnpgIecBZ8BTug3COFKrPDEHZ1AVtp95EYV8cj616QBHFLAj_J1d9uut7aAqDj2Dif9wjPrjJF0V9Z1x8ZaXWuUs9k61J2Q6EpTqPc7B9-Kfwi7t2YL2QfEwTc28VE9fH40b_ZOv2FBfrvah49OgbaLIyiSAlf8b82wCc5-osFFBFgV-zqyIpt5Rdii6C8-AS5WWkLlk2DgjTauTUWtkErA6Hs5CgwE7qpRHOXB5qbM98kDlqtWcpnAKIAIWi0WG9r6vsNiHTqv1zh0sa0TZ3mPSV_LrVB7CCAzv-42FktPwmEkiaROZEu5Zl2wx3EJq21LJKHeIQTmdhV9amMvLvRCWb9z-pjOHbvfrrm5fJCdtQa9jAh-X7aW4k9qMhWVfmYwZKlVicGfn15A8GccQ6-d3v4cXsgw3hU8gJfBI3_RyJVbOs3pupR_zAqiadA2KeSK8zAgMbC1eN_91x9eUF4i9bgzZdJmUM9kg6iX7zWv7jG6Lml5H2kXbSamVjtQyr1G2hXkqab-qGQPZf4brLGOukaY_I6Y5HZFD549vtzcwGBPiXHRjT68ieuDb_F5PEpfB-8,JWT_EXPIRATION_TIME=24h,JWT_SECRET=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiYWRtaW4iOnRydWUsImlhdCI6MTUxNjIzOTAyMn0.KMUFsIDTnFmyG3nMiGM6H9FNFUROf3wh7SmqJp-QV30,METAAPI_APPLICATION=TradeTaper,METAAPI_DOMAIN=agiliumtrade.ai,METAAPI_REQUEST_TIMEOUT=60000,METAAPI_MOCK_MODE=false,METAAPI_WEBSOCKET_TIMEOUT=60,STRIPE_PRICE_STARTER_MONTHLY=price_1QH5dRJF0yiNfCnPpLYhHnDV,STRIPE_PRICE_STARTER_YEARLY=price_1QH5dRJF0yiNfCnPpLYhHnDX,STRIPE_PRICE_PROFESSIONAL_MONTHLY=price_1QH5dRJF0yiNfCnPpLYhHnDY,STRIPE_PRICE_PROFESSIONAL_YEARLY=price_1QH5dRJF0yiNfCnPpLYhHnDZ,STRIPE_PRICE_ENTERPRISE_MONTHLY=price_1QH5dRJF0yiNfCnPpLYhHnDA,STRIPE_PRICE_ENTERPRISE_YEARLY=price_1QH5dRJF0yiNfCnPpLYhHnDB,STRIPE_SECRET_KEY=sk_test_51HCsYUKCBJK5GhoVRw2fa2u59R2biPCde1MCP2IU8MSz92deeKHrD0FKAReXFeOpqWiN387NoeauU3pFCy3k18sS000AokIvgM,STRIPE_PUBLISHABLE_KEY=pk_test_51HCsYUKCBJK5GhoVW20cTDcwCJvPbGMSSU57Oo0Dfr1tVVmhXMmPJlqiFFaXW5qHjaXc7QcuIIlWzyqk8aHssZxh002dpfXexM,STRIPE_WEBHOOK_SECRET=whsec_CIuvLwdJp1FciFX08RB6nXKmXTd3ZsIV,FRONTEND_URL=https://tradetaper-frontend-benniejosephs-projects.vercel.app,TRADERMADE_API_KEY=X4FgwHzL7HpukWs4FjYV,GCS_PUBLIC_URL_PREFIX=https://storage.googleapis.com/tradetaper-bucket-images,GCS_BUCKET_NAME=tradetaper-bucket-images"

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