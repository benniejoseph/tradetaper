#!/bin/bash
set -e

# Deploy to Cloud Run using .env.yaml for environment variables
# We perform a full source deployment to ensure code changes are picked up

echo "Deploying to Cloud Run (Source Deployment)..."

gcloud run deploy tradetaper-backend \
  --source . \
  --region us-central1 \
  --env-vars-file=.env.yaml \
  --update-secrets="GOOGLE_APPLICATION_CREDENTIALS=firebase-adminsdk:latest"

echo "Deployment finished!"
