# Deployment Instructions for TradingView Integration

## ✅ What's Been Completed

1. ✅ **TradingView Integration Code** - Fully implemented and tested locally
2. ✅ **TypeScript Build** - All compilation errors fixed
3. ✅ **Docker Image** - Built and pushed to GCR
4. ✅ **Database Configuration** - Fixed to use Cloud SQL Connector
5. ✅ **Environment Variables** - Updated with TradingView credentials

## ⚠️ Current Issue

Cloud Run is persistently using the old revision (`tradetaper-backend-00040-496`) despite multiple deployment attempts with the new image. This appears to be a Cloud Run caching issue.

## 📦 Docker Images Available

- **Old Working Image**: `gcr.io/trade-taper/tradetaper-backend@sha256:ca7126c096eb` (currently deployed)
- **New TradingView Image**: `gcr.io/trade-taper/tradetaper-backend:v2-tradingview` (sha256:9bdd03073b2b)
  - Includes TradingView integration
  - Includes database configuration fix
  - Includes all TypeScript fixes

## 🚀 Manual Deployment Options

### Option 1: Delete and Recreate the Service

This will force Cloud Run to use the new image:

```bash
cd tradetaper-backend

# 1. Delete the existing service
gcloud run services delete tradetaper-backend --region us-central1 --quiet

# 2. Deploy as a new service with the new image
gcloud run deploy tradetaper-backend \
  --image gcr.io/trade-taper/tradetaper-backend:v2-tradingview \
  --region us-central1 \
  --platform managed \
  --allow-unauthenticated \
  --env-vars-file env-vars.yaml \
  --add-cloudsql-instances trade-taper:us-central1:trade-taper-postgres \
  --timeout 300 \
  --max-instances 10
```

### Option 2: Use Google Cloud Console

1. Go to https://console.cloud.google.com/run
2. Select the `tradetaper-backend` service
3. Click "EDIT & DEPLOY NEW REVISION"
4. Under "Container image URL", paste: `gcr.io/trade-taper/tradetaper-backend:v2-tradingview`
5. Click "DEPLOY"

### Option 3: Use gcloud with `--no-traffic` and then Migrate

```bash
cd tradetaper-backend

# Deploy new revision without serving traffic
gcloud run deploy tradetaper-backend \
  --image gcr.io/trade-taper/tradetaper-backend:v2-tradingview \
  --region us-central1 \
  --platform managed \
  --no-traffic \
  --env-vars-file env-vars.yaml \
  --add-cloudsql-instances trade-taper:us-central1:trade-taper-postgres \
  --timeout 300

# Get the new revision name from the output, then migrate traffic
gcloud run services update-traffic tradetaper-backend \
  --region us-central1 \
  --to-revisions <NEW_REVISION_NAME>=100
```

## 🧪 Testing the Deployment

Once deployed, test the new endpoints:

```bash
# 1. Check health
curl https://tradetaper-backend-326520250422.us-central1.run.app/api/v1/health

# 2. Check TradingView status
curl https://tradetaper-backend-326520250422.us-central1.run.app/api/v1/market-intelligence/tradingview-advanced/status

# Expected response:
# {
#   "success": true,
#   "data": {
#     "authenticated": true,
#     "ready": true
#   }
# }

# 3. Get technical analysis for XAUUSD
curl "https://tradetaper-backend-326520250422.us-central1.run.app/api/v1/market-intelligence/tradingview-advanced/technical-analysis?symbol=XAUUSD&interval=4h"

# 4. Get ICT indicators
curl "https://tradetaper-backend-326520250422.us-central1.run.app/api/v1/market-intelligence/tradingview-advanced/ict-indicators?symbol=XAUUSD&interval=240"
```

## 📊 Available API Endpoints

Once deployed, these endpoints will be available:

### GET `/api/v1/market-intelligence/tradingview-advanced/status`
Check TradingView connection status

### GET `/api/v1/market-intelligence/tradingview-advanced/technical-analysis`
Query Parameters:
- `symbol` (default: "XAUUSD")
- `interval` (default: "4h")

### POST `/api/v1/market-intelligence/tradingview-advanced/chart-data`
Request Body:
```json
{
  "symbol": "XAUUSD",
  "interval": "240",
  "indicators": ["Volume", "RSI"]
}
```

### POST `/api/v1/market-intelligence/tradingview-advanced/indicator`
Request Body:
```json
{
  "symbol": "XAUUSD",
  "indicatorName": "Volume",
  "interval": "240"
}
```

### GET `/api/v1/market-intelligence/tradingview-advanced/drawings`
Query Parameters:
- `chartId` (required)

### GET `/api/v1/market-intelligence/tradingview-advanced/screener`
Query Parameters:
- `filter` (default: "top_gainers")
- `market` (default: "forex")

### GET `/api/v1/market-intelligence/tradingview-advanced/ict-indicators`
Query Parameters:
- `symbol` (default: "XAUUSD")
- `interval` (default: "240")

Returns:
- Volume data
- Pivot Points High Low
- Previous Day High Low
- Session Volume HD

## 🔧 Local Testing (Alternative)

If you want to test the integration locally before deploying:

```bash
cd tradetaper-backend

# 1. Install dependencies
npm install

# 2. Set environment variables
export NODE_ENV=development
export DB_HOST=localhost
export DB_PORT=5432
export DB_USERNAME=postgres
export DB_PASSWORD=Tradetaper2025
export DB_DATABASE=tradetaper
export TRADINGVIEW_USERNAME=benniejoseph.r@gmail.com
export TRADINGVIEW_PASSWORD=Bjrsks14311519!

# 3. Run the backend
npm run start:dev

# 4. Test the endpoints on localhost:3000
curl http://localhost:3000/api/v1/market-intelligence/tradingview-advanced/status
```

## 📝 Notes

- The old backend is still running and healthy at the production URL
- The new image has been successfully built and pushed to GCR
- The database configuration has been fixed to use Cloud SQL Connector
- All TypeScript errors have been resolved
- The TradingView credentials are correctly configured in `env-vars.yaml`

## 🆘 Troubleshooting

If the deployment fails with database connection errors:
1. Check that `INSTANCE_CONNECTION_NAME` is set correctly in `env-vars.yaml`
2. Verify that the Cloud SQL instance `trade-taper:us-central1:trade-taper-postgres` exists
3. Ensure the service account has Cloud SQL Client permissions

If TradingView authentication fails:
1. Verify the credentials in `env-vars.yaml`
2. Check the logs for TradingView authentication errors
3. The service will retry authentication automatically

---

**Next Step**: Choose one of the deployment options above to deploy the new image with TradingView integration.

