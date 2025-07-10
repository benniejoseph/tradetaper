#!/bin/bash

# Exit immediately if a command exits with a non-zero status.
set -e

# Enable necessary APIs
echo "Enabling APIs..."
gcloud services enable run.googleapis.com \
  sqladmin.googleapis.com \
  artifactregistry.googleapis.com \
  cloudbuild.googleapis.com

# Configuration
# Set the GCP Project ID and region.
PROJECT_ID="tradetaper"
REGION="us-central1"
SERVICE_ACCOUNT_NAME="tradetaper-backend-sa"
SERVICE_NAME="tradetaper-backend"
DB_INSTANCE_NAME="tradetaper-postgres"
DB_NAME="tradetaper"
DOCKER_REPO_NAME="tradetaper-backend-repo"
export SERVICE_ACCOUNT_EMAIL="${SERVICE_ACCOUNT_NAME}@${PROJECT_ID}.iam.gserviceaccount.com"
export DB_USER_NAME="${SERVICE_ACCOUNT_NAME}@${PROJECT_ID}.iam"
export REPO_NAME="tradetaper-backend-test-repo"
export IMAGE_NAME="${REGION}-docker.pkg.dev/${PROJECT_ID}/${REPO_NAME}/tradetaper-backend-test"
export INSTANCE_NAME="tradetaper-postgres" # TODO: Make this configurable
export INSTANCE_CONNECTION_NAME=$(gcloud sql instances describe ${INSTANCE_NAME} --project=${PROJECT_ID} --format='value(connectionName)')

# Create a dedicated service account
echo "Creating service account..."
if ! gcloud iam service-accounts describe ${SERVICE_ACCOUNT_EMAIL} > /dev/null 2>&1; then
  gcloud iam service-accounts create ${SERVICE_ACCOUNT_NAME} \
    --display-name="TradeTaper Backend Service Account"
fi

# Grant the Cloud SQL Client role
echo "Granting Cloud SQL Client role..."
gcloud projects add-iam-policy-binding ${PROJECT_ID} \
  --member="serviceAccount:${SERVICE_ACCOUNT_EMAIL}" \
  --role="roles/cloudsql.client"

# Enable IAM database authentication
echo "Enabling IAM database authentication..."
gcloud sql instances patch ${INSTANCE_NAME} --database-flags=cloudsql.iam_authentication=on

# Create a database user for the service account
echo "Creating database user for service account..."
if ! gcloud sql users list --instance=${INSTANCE_NAME} --project=${PROJECT_ID} --format="value(name)" | grep -q "^${DB_USER_NAME}$"; then
  gcloud sql users create "${DB_USER_NAME}" \
    --instance=${INSTANCE_NAME} \
    --type=cloud_iam_service_account
fi

# Create Artifact Registry repository if it doesn't exist
echo "Creating Artifact Registry repository..."
if ! gcloud artifacts repositories describe ${DOCKER_REPO_NAME} --location=${REGION} > /dev/null 2>&1; then
  gcloud artifacts repositories create "${DOCKER_REPO_NAME}" --repository-format=docker --location="${REGION}" --description="Docker repository for TradeTaper Backend" || echo "Repository already exists."
fi

# Attempt to delete the existing Docker image to force a rebuild.
echo "Attempting to delete existing Docker image..."
gcloud artifacts docker images delete "${REGION}-docker.pkg.dev/${PROJECT_ID}/${DOCKER_REPO_NAME}/${SERVICE_NAME}:latest" --delete-tags --quiet || echo "No existing image to delete, or deletion failed. Proceeding with build."

# Build a new Docker image using Google Cloud Build.
echo "Building new Docker image..."
gcloud builds submit "tradetaper-backend" \
  --region "${REGION}" \
  --tag "${REGION}-docker.pkg.dev/${PROJECT_ID}/${DOCKER_REPO_NAME}/${SERVICE_NAME}:latest" \
  --suppress-logs || { echo "Cloud Build failed."; exit 1; }

# Deploy to Cloud Run
echo "Deploying to Cloud Run..."
gcloud run deploy "${SERVICE_NAME}" \
  --image "${REGION}-docker.pkg.dev/${PROJECT_ID}/${DOCKER_REPO_NAME}/${SERVICE_NAME}:latest" \
  --region "${REGION}" \
  --platform "managed" \
  --service-account=${SERVICE_ACCOUNT_EMAIL} \
  --add-cloudsql-instances=${INSTANCE_CONNECTION_NAME} \
  --set-env-vars "INSTANCE_CONNECTION_NAME=${INSTANCE_CONNECTION_NAME}" \
  --set-env-vars "DB_USER=${DB_USER_NAME}" \
  --set-env-vars "DB_NAME=tradetaper" \
  --allow-unauthenticated

# TODO:
# 1. Update the application's database connection to use the Cloud SQL Connector with IAM auth. 