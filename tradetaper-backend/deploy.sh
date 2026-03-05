#!/bin/bash
set -e

# Deploy to Cloud Run from source while preserving the service's
# existing environment variable and secret bindings.

echo "Deploying to Cloud Run (Source Deployment)..."

gcloud run deploy tradetaper-backend \
  --source . \
  --region us-central1

echo "Deployment finished!"
