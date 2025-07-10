#!/bin/bash

# Exit immediately if a command exits with a non-zero status.
set -e

# Configuration
PROJECT_ID="tradetaper"
APP_CONFIG_FILE="tradetaper-backend/app.yaml"

echo "Deploying to App Engine..."
echo "Project: ${PROJECT_ID}"
echo "Config file: ${APP_CONFIG_FILE}"

# Deploy the application to App Engine.
gcloud app deploy "${APP_CONFIG_FILE}" --project="${PROJECT_ID}" --quiet

echo "✅ Deployment to App Engine initiated successfully."
echo "Monitor the deployment progress in the Google Cloud Console." 