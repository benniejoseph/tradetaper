# L2A3: Deployment Plan

This document details the deployment strategy for the TradeTaper application, covering GCP Cloud Run for the backend and Vercel for the frontend and admin panels.

## 1. GCP Cloud Run Deployment (tradetaper-backend)

### 1.1. Dockerfile

(See `tradetaper-backend/Dockerfile` for content)

### 1.2. Cloud Build Configuration

(See `tradetaper-backend/cloudbuild.yaml` for content)

### 1.3. IAM Roles and Service Accounts

To ensure secure and functional deployment on GCP Cloud Run, the following IAM roles and service accounts are required:

-   **Cloud Run Service Account**: This service account will be associated with the Cloud Run service and will execute the backend application.
    -   **Required Roles**:
        -   `Cloud Run Invoker`: Allows the service to be invoked.
        -   `Cloud SQL Client`: Allows connection to the PostgreSQL database hosted on Cloud SQL.
        -   `Storage Object Viewer` and `Storage Object Creator`: If the backend interacts with Google Cloud Storage (e.g., for file uploads, chart images).
        -   `Secret Manager Secret Accessor`: If secrets (e.g., API keys, database credentials) are stored in Google Secret Manager.
        -   `Service Account User`: To allow other service accounts (e.g., Cloud Build) to impersonate this service account.

-   **Cloud Build Service Account**: This service account is used by Cloud Build to perform build and deployment operations.
    -   **Required Roles**:
        -   `Cloud Build Service Account`: Default role for Cloud Build.
        -   `Cloud Run Admin`: Allows deployment and management of Cloud Run services.
        -   `Service Account User`: Allows impersonation of the Cloud Run service account.
        -   `Storage Object Admin`: To push Docker images to Google Container Registry (GCR).

-   **Cloud SQL Admin Service Account (Optional, for initial setup/migrations)**: A service account with administrative privileges for Cloud SQL, primarily for initial database setup, migrations, and schema changes.
    -   **Required Roles**:
        -   `Cloud SQL Admin`

### 1.4. Cloud SQL Instance Configuration

-   **Database Type**: PostgreSQL
-   **Region**: `us-central1` (or chosen region)
-   **Connectivity**: Private IP preferred for secure connection from Cloud Run. Public IP with authorized networks if private IP is not feasible.
-   **Database User**: Create a dedicated database user for the `tradetaper-backend` with appropriate permissions.

### 1.5. Environment Variables (Cloud Run)

Environment variables will be set in the Cloud Run service configuration. These should be managed securely, preferably via Google Secret Manager.

-   `DATABASE_URL`: Connection string for the PostgreSQL database.
-   `JWT_SECRET`: Secret key for JWT authentication.
-   `GOOGLE_CLIENT_ID`: Google OAuth Client ID.
-   `GOOGLE_CLIENT_SECRET`: Google OAuth Client Secret.
-   `STRIPE_SECRET_KEY`: Stripe API secret key.
-   `METAAPI_TOKEN`: MetaAPI Cloud SDK token.
-   `METAAPI_ACCOUNT_ID`: MetaAPI account ID.
-   `GCS_BUCKET_NAME`: Google Cloud Storage bucket name (for chart images, etc.).
-   `GEMINI_API_KEY`: API Key for Google Gemini API.

## 2. Vercel Deployment (tradetaper-frontend & tradetaper-admin)

### 2.1. Project Configuration

Both `tradetaper-frontend` and `tradetaper-admin` will be deployed as separate projects on Vercel.

-   **Framework Preset**: Next.js
-   **Root Directory**: `tradetaper-frontend` for the frontend project, `tradetaper-admin` for the admin project.
-   **Build Command**: `npm run build`
-   **Output Directory**: `.next`
-   **Development Command**: `npm run dev`

### 2.2. Environment Variables (Vercel)

Environment variables for Vercel projects should be configured securely within the Vercel dashboard.

-   `NEXT_PUBLIC_API_URL`: URL of the deployed `tradetaper-backend` Cloud Run service.
-   `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`: Stripe publishable key.
-   `NEXT_PUBLIC_GOOGLE_CLIENT_ID`: Google OAuth Client ID (public-facing).
-   `NEXT_PUBLIC_GEMINI_API_KEY`: API Key for Google Gemini API (public-facing).

### 2.3. Git Integration

-   Connect both Vercel projects to their respective subdirectories within the GitHub monorepo.
-   Configure automatic deployments on Git pushes to the `main` branch (or a designated production branch).

## 3. Deployment Steps (High-Level)

1.  **GCP Project Setup**: Create a new GCP project.
2.  **Enable APIs**: Enable Cloud Run, Cloud Build, Cloud SQL Admin, Secret Manager, and Cloud Storage APIs.
3.  **Cloud SQL Setup**: Create a PostgreSQL instance in Cloud SQL and configure private IP (recommended) or authorized networks.
4.  **Database Initialization**: Run initial database migrations and seeding (if any) from a secure environment (e.g., Cloud Shell, a temporary VM).
5.  **Secret Manager Setup**: Store sensitive environment variables in Google Secret Manager.
6.  **Cloud Run Service Account**: Create and configure the Cloud Run service account with necessary permissions.
7.  **Cloud Build Service Account**: Ensure the Cloud Build service account has the required permissions.
8.  **Backend Deployment**: Configure Cloud Build to automatically build and deploy the `tradetaper-backend` Docker image to Cloud Run on Git pushes.
9.  **Vercel Project Setup**: Create two new Vercel projects, one for `tradetaper-frontend` and one for `tradetaper-admin`.
10. **Vercel Environment Variables**: Configure environment variables in Vercel for both frontend projects.
11. **Vercel Git Integration**: Connect Vercel projects to the GitHub repository for automatic deployments.
12. **DNS Configuration**: Update DNS records to point custom domains to Vercel and Cloud Run endpoints.

## 4. Post-Deployment Verification

-   Verify that all services are running and accessible.
-   Check logs for any errors.
-   Perform end-to-end tests to ensure all features are functional.
-   Audit IAM policies and network configurations for security best practices.