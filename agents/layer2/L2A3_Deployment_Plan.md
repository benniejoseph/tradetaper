# L2A3: Deployment & DevOps Strategy

## 1. Overview
This document outlines the detailed deployment strategy for the TradeTaper application, covering GCP Cloud Run for the NestJS backend and Vercel for the Next.js frontend and admin applications.

## 2. GCP Cloud Run Deployment (tradetaper-backend)

### 2.1. Dockerfile & Cloudbuild.yaml
*   **Dockerfile:** Created in `tradetaper-backend/Dockerfile`.
    *   Uses `node:20-slim` as base image.
    *   Installs production dependencies.
    *   Builds the NestJS application.
    *   Exposes port 3000.
    *   Starts the application using `node dist/main`.
*   **cloudbuild.yaml:** Created in `tradetaper-backend/cloudbuild.yaml`.
    *   Builds the Docker image and tags it with `gcr.io/$PROJECT_ID/tradetaper-backend:$COMMIT_SHA`.
    *   Pushes the image to Google Container Registry.
    *   Deploys the image to Cloud Run service named `tradetaper-backend`.
    *   Configured for `us-central1` region (can be changed).
    *   `--allow-unauthenticated` is set for initial testing; this should be reviewed for production and potentially secured with IAM or IAP.
    *   Exposes port 3000.

### 2.2. GCP Project Setup

*   **Project Creation:** A new GCP project should be created (e.g., `tradetaper-prod`).
*   **APIs to Enable:**
    *   Cloud Run API
    *   Cloud SQL Admin API
    *   Cloud Build API
    *   Artifact Registry API (if using Artifact Registry instead of Container Registry)
*   **Cloud SQL Instance:**
    *   Provision a PostgreSQL instance (e.g., `tradetaper-postgres`).
    *   Configure database flags, backups, and high availability as needed.
    *   Create a database for the application (e.g., `tradetaper_db`).
*   **VPC Connector (Optional but Recommended):** If the Cloud Run service needs to connect to private GCP resources (like a private Cloud SQL instance), a Serverless VPC Access connector should be configured.

### 2.3. IAM Roles and Service Accounts

*   **Cloud Build Service Account:** The default Cloud Build service account (`<PROJECT_NUMBER>@cloudbuild.gserviceaccount.com`) will need the following roles:
    *   `Cloud Run Admin` (roles/run.admin): To deploy and manage Cloud Run services.
    *   `Service Account User` (roles/iam.serviceAccountUser): To act as the Cloud Run runtime service account.
    *   `Storage Admin` (roles/storage.admin): If storing build artifacts in Cloud Storage.
    *   `Cloud SQL Client` (roles/cloudsql.client): If Cloud Build needs to run database migrations directly (less common, usually handled by Cloud Run service account).
*   **Cloud Run Runtime Service Account:** A dedicated service account (ee.g., `tradetaper-backend-sa@<PROJECT_ID>.iam.gserviceaccount.com`) should be created and assigned to the Cloud Run service. This service account will need:
    *   `Cloud SQL Client` (roles/cloudsql.client): To connect to the Cloud SQL PostgreSQL instance.
    *   `Secret Manager Secret Accessor` (roles/secretmanager.secretAccessor): If using Secret Manager for database credentials or API keys.
    *   `Storage Object Viewer/Creator` (roles/storage.objectViewer, roles/storage.objectCreator): If the backend interacts with Google Cloud Storage (e.g., for uploaded images).

## 3. Vercel Deployment (tradetaper-frontend & tradetaper-admin)

### 3.1. Project Configuration

*   **New Vercel Projects:** Create two new Vercel projects, one for `tradetaper-frontend` and one for `tradetaper-admin`.
*   **Git Integration:** Connect both Vercel projects to their respective GitHub repositories (or the monorepo if Vercel supports sub-directory deployments for Next.js).
*   **Build Commands:** Vercel automatically detects Next.js projects, so default build commands (`next build`) should suffice.
*   **Root Directory:** Ensure the root directory is correctly set for each project within the monorepo (e.g., `tradetaper-frontend/` and `tradetaper-admin/`).

### 3.2. Environment Variables

*   **Frontend (`tradetaper-frontend`):
    *   `NEXT_PUBLIC_BACKEND_API_URL`: URL of the deployed `tradetaper-backend` Cloud Run service.
    *   `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`
    *   `NEXT_PUBLIC_GOOGLE_CLIENT_ID`
    *   Other public API keys or configuration.
*   **Admin (`tradetaper-admin`):
    *   `NEXT_PUBLIC_BACKEND_API_URL`: URL of the deployed `tradetaper-backend` Cloud Run service.
    *   Other public API keys or configuration.

### 3.3. Custom Domains

*   Configure custom domains for both frontend and admin applications (e.g., `app.tradetaper.com` and `admin.tradetaper.com`).

## 4. Deployment Workflow

1.  **Backend First:** Deploy `tradetaper-backend` to Cloud Run. This ensures the API is available for the frontends.
2.  **Update Frontend ENV:** Once the backend URL is stable, update the `NEXT_PUBLIC_BACKEND_API_URL` environment variable in Vercel for both frontend and admin projects.
3.  **Frontend Deployment:** Deploy `tradetaper-frontend` and `tradetaper-admin` to Vercel.
4.  **Database Migrations:** Run TypeORM migrations on the Cloud SQL instance after the backend deployment (can be part of Cloud Build or a separate manual step).

## 5. Monitoring & Logging

*   **GCP Cloud Logging:** Cloud Run logs will automatically be sent to Cloud Logging.
*   **GCP Cloud Monitoring:** Set up alerts for Cloud Run service health, latency, and error rates.
*   **Vercel Analytics:** Utilize Vercel's built-in analytics for frontend performance and usage.
