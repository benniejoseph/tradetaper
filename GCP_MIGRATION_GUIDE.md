# TradeTaper - Google Cloud Platform Migration Guide

## Overview
This guide helps you migrate TradeTaper backend from Railway to Google Cloud Platform for better reliability and performance.

## Prerequisites

1. **Google Cloud Account**
   - Create account at https://cloud.google.com
   - Enable billing for your project

2. **Install Google Cloud SDK**
   ```bash
   # macOS
   brew install google-cloud-sdk
   
   # Linux/Windows
   # Download from: https://cloud.google.com/sdk/docs/install
   ```

3. **Authenticate with Google Cloud**
   ```bash
   gcloud auth login
   gcloud auth application-default login
   ```

## Migration Steps

### Step 1: Create GCP Project
```bash
# Create new project
gcloud projects create tradetaper-production --name="TradeTaper Production"

# Set as default project
gcloud config set project tradetaper-production
```

### Step 2: Run Automated Deployment
```bash
# Navigate to project root
cd /Users/benniejoseph/Documents/TradeTaper

# Run deployment script
./deploy-gcp.sh tradetaper-production
```

The script will automatically:
- ✅ Enable required Google Cloud APIs
- ✅ Create Cloud SQL PostgreSQL database
- ✅ Build and deploy backend to Cloud Run
- ✅ Configure database connections
- ✅ Set up environment variables

### Step 3: Update Frontend Configuration

After deployment, update the admin frontend:

```bash
# Update tradetaper-admin/.env.local
NEXT_PUBLIC_API_URL=https://tradetaper-backend-[HASH]-uc.a.run.app/api/v1
```

### Step 4: Test Deployment

```bash
# Test health endpoints
curl https://tradetaper-backend-[HASH]-uc.a.run.app/health
curl https://tradetaper-backend-[HASH]-uc.a.run.app/api/v1/health

# Test admin endpoints
curl -H "Authorization: Bearer mock-admin-token" \
  https://tradetaper-backend-[HASH]-uc.a.run.app/api/v1/admin/dashboard-stats
```

## GCP Services Used

### Cloud Run
- **Purpose**: Backend API hosting
- **Benefits**: Auto-scaling, pay-per-use, reliable deployments
- **Configuration**: 1 vCPU, 1GB RAM, auto-scaling

### Cloud SQL PostgreSQL
- **Purpose**: Primary database
- **Benefits**: Managed service, automated backups, high availability
- **Configuration**: db-f1-micro tier, 10GB SSD storage

### Cloud Build
- **Purpose**: Automated CI/CD pipeline
- **Benefits**: Integrated with Git, Docker support, fast builds

## Cost Estimation

**Monthly costs (approximate):**
- Cloud Run: $5-20 (depending on traffic)
- Cloud SQL: $7-15 (db-f1-micro instance)
- Cloud Build: $0-5 (free tier covers most usage)
- **Total: ~$12-40/month**

## Migration Benefits

### Reliability
- ✅ 99.95% uptime SLA
- ✅ No deployment failures like Railway
- ✅ Managed database with automated backups

### Performance
- ✅ Auto-scaling based on traffic
- ✅ Global CDN integration
- ✅ Faster cold starts than Railway

### Features
- ✅ Integrated monitoring and logging
- ✅ Custom domains with SSL
- ✅ Advanced database features

## Rollback Plan

If needed, you can continue using Railway while testing GCP:

1. Keep Railway deployment active
2. Test GCP deployment thoroughly
3. Update DNS/frontend URLs when ready
4. Decommission Railway after successful migration

## Support

For issues during migration:
1. Check Google Cloud Console logs
2. Use `gcloud logs read` for debugging
3. Monitor Cloud SQL performance metrics
4. Test endpoints with curl commands provided above

---

**Next Steps**: Run `./deploy-gcp.sh` to begin the automated migration process.