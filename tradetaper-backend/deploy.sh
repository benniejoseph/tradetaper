#!/bin/bash
set -e

# Deploy to Cloud Run from source while preserving the service's
# existing environment variable and secret bindings.

PROJECT_ID="trade-taper"
SERVICE_NAME="tradetaper-backend"
REGION="us-central1"

echo "Deploying to Cloud Run (Source Deployment)..."
echo "Project: ${PROJECT_ID}"
echo "Service: ${SERVICE_NAME}"
echo "Region: ${REGION}"

gcloud run deploy ${SERVICE_NAME} \
  --source . \
  --project ${PROJECT_ID} \
  --region ${REGION}

echo "Deployment finished!"
