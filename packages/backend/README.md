# TradeTaper Backend

This is the backend service for the TradeTaper application, built with Express.js and MongoDB.

## Setup

1. Install dependencies:
```bash
npm install
```

2. Create a `.env` file in the root directory with the following variables:
```
PORT=3000
MONGODB_URI=mongodb://localhost:27017/tradetaper
NODE_ENV=development
```

3. Build the project:
```bash
npm run build
```

4. Start the development server:
```bash
npm run dev
```

## API Endpoints

### Trades

- `GET /api/trades` - Get all trades
- `GET /api/trades/:id` - Get a specific trade
- `POST /api/trades` - Create a new trade
- `PUT /api/trades/:id` - Update a trade
- `DELETE /api/trades/:id` - Delete a trade

## Development

The backend uses TypeScript and shares DTOs with the frontend through the `@tradetaper/shared-dto` package. Make sure to rebuild the shared DTOs if you make changes to them.

## Deployment

### Prerequisites

1. Google Cloud SDK installed
2. Docker installed
3. Access to a Google Cloud project

### Deployment Steps

1. Create a `.env.yaml` file with the following content:
```yaml
NODE_ENV: "production"
MONGODB_URI: "your-mongodb-uri"
PORT: "3000"
```

2. Build and deploy using the provided script:
```bash
# From the project root
./deploy-gcp.sh your-project-id
```

Or manually:

```bash
# Set your project ID
export PROJECT_ID="your-project-id"
gcloud config set project $PROJECT_ID

# Build and push Docker image
docker buildx build --platform linux/amd64 \
    -t gcr.io/$PROJECT_ID/tradetaper-backend:latest \
    -f packages/backend/Dockerfile .

docker push gcr.io/$PROJECT_ID/tradetaper-backend:latest

# Deploy to Cloud Run
gcloud run deploy tradetaper-backend \
    --image gcr.io/$PROJECT_ID/tradetaper-backend:latest \
    --region us-central1 \
    --platform managed \
    --allow-unauthenticated \
    --memory 1Gi \
    --cpu 1 \
    --max-instances 10 \
    --timeout 900 \
    --env-vars-file packages/backend/.env.yaml
```

For more detailed deployment instructions, refer to the `GCP_DEPLOYMENT_GUIDE.md` in the project root. 