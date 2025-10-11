#!/bin/bash

# 🚀 Migrate TradeTaper from App Engine to Cloud Run
# This can reduce costs by 50-70% compared to App Engine

PROJECT_ID="trade-taper"
SERVICE_NAME="tradetaper-backend"
REGION="us-central1"

echo "🔄 Migrating TradeTaper Backend from App Engine to Cloud Run..."

# 1. Create Dockerfile for Cloud Run (if not exists)
if [ ! -f "tradetaper-backend/Dockerfile" ]; then
    echo "📝 Creating optimized Dockerfile for Cloud Run..."
    
    cat > tradetaper-backend/Dockerfile << 'EOF'
# Use Node.js 20 LTS Alpine for smaller image size
FROM node:20-alpine

# Set working directory
WORKDIR /app

# Copy package files first (for better Docker layer caching)
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production && npm cache clean --force

# Copy source code
COPY . .

# Build the application
RUN npm run build

# Expose port (Cloud Run uses PORT environment variable)
EXPOSE $PORT

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:$PORT/health || exit 1

# Start the application
CMD ["npm", "run", "start:prod"]
EOF
fi

# 2. Create Cloud Run deployment configuration
echo "⚙️ Creating Cloud Run service configuration..."

cat > tradetaper-backend/cloudrun.yaml << EOF
apiVersion: serving.knative.dev/v1
kind: Service
metadata:
  name: ${SERVICE_NAME}
  annotations:
    run.googleapis.com/ingress: all
    run.googleapis.com/cpu-throttling: "true"
spec:
  template:
    metadata:
      annotations:
        # Cost optimization: Scale to zero when idle
        autoscaling.knative.dev/minScale: "0"
        autoscaling.knative.dev/maxScale: "3"
        
        # Use Cloud SQL Proxy sidecar
        run.googleapis.com/cloudsql-instances: "${PROJECT_ID}:${REGION}:trade-taper-postgres"
        
        # Resource limits for cost control
        run.googleapis.com/cpu: "1"
        run.googleapis.com/memory: "1Gi"
        run.googleapis.com/execution-environment: gen2
    spec:
      containerConcurrency: 80
      timeoutSeconds: 300
      containers:
      - image: gcr.io/${PROJECT_ID}/${SERVICE_NAME}:latest
        ports:
        - containerPort: 8080
        env:
        # Database configuration
        - name: NODE_ENV
          value: "production"
        - name: USE_CLOUD_SQL
          value: "true"
        - name: DB_USER
          value: "postgres"
        - name: DB_NAME
          value: "tradetaper"
        - name: INSTANCE_CONNECTION_NAME
          value: "${PROJECT_ID}:${REGION}:trade-taper-postgres"
        - name: PORT
          value: "8080"
        
        # Add other environment variables from app.yaml here
        
        resources:
          limits:
            cpu: 1000m
            memory: 1Gi
          requests:
            cpu: 100m
            memory: 256Mi
EOF

# 3. Create build and deploy script
echo "🏗️ Creating build and deploy script..."

cat > tradetaper-backend/deploy-cloudrun.sh << 'EOF'
#!/bin/bash

PROJECT_ID="trade-taper"
SERVICE_NAME="tradetaper-backend"
REGION="us-central1"

# Build and push container image
echo "🏗️ Building container image..."
gcloud builds submit --tag gcr.io/${PROJECT_ID}/${SERVICE_NAME}:latest .

# Deploy to Cloud Run
echo "🚀 Deploying to Cloud Run..."
gcloud run deploy ${SERVICE_NAME} \
    --image gcr.io/${PROJECT_ID}/${SERVICE_NAME}:latest \
    --region ${REGION} \
    --platform managed \
    --allow-unauthenticated \
    --port 8080 \
    --memory 1Gi \
    --cpu 1 \
    --timeout 300 \
    --max-instances 3 \
    --min-instances 0 \
    --concurrency 80 \
    --add-cloudsql-instances ${PROJECT_ID}:${REGION}:trade-taper-postgres \
    --set-env-vars="NODE_ENV=production,USE_CLOUD_SQL=true,DB_USER=postgres,DB_NAME=tradetaper,INSTANCE_CONNECTION_NAME=${PROJECT_ID}:${REGION}:trade-taper-postgres,PORT=8080"

# Get the service URL
SERVICE_URL=$(gcloud run services describe ${SERVICE_NAME} --region ${REGION} --format 'value(status.url)')

echo "✅ Cloud Run deployment complete!"
echo "🌐 Service URL: ${SERVICE_URL}"
echo ""
echo "💰 Expected cost reduction: 50-70% compared to App Engine"
echo "📊 Cloud Run pricing: Pay per request (vs always-on App Engine)"
EOF

chmod +x tradetaper-backend/deploy-cloudrun.sh

# 4. Create cost comparison report
echo "📊 Creating cost comparison analysis..."

cat > cloud-run-cost-analysis.md << 'EOF'
# 💰 Cost Comparison: App Engine vs Cloud Run

## Current App Engine Costs (Estimated)
- **F1 Instance (min_instances: 1)**: $30-50/month
- **Always-on costs**: 24/7 billing
- **Scaling costs**: Additional instances during traffic spikes

## Cloud Run Costs (Estimated)
- **Idle time**: $0 (scales to zero)
- **Active time**: ~$0.10 per 100,000 requests
- **Memory**: $0.0000024 per GB-second
- **CPU**: $0.0000024 per vCPU-second

## Monthly Cost Estimates

### Low Traffic (10,000 requests/month)
- **App Engine**: $35/month
- **Cloud Run**: $3-5/month
- **Savings**: 85-90%

### Medium Traffic (100,000 requests/month)
- **App Engine**: $45/month
- **Cloud Run**: $8-12/month
- **Savings**: 70-80%

### High Traffic (1,000,000 requests/month)
- **App Engine**: $60/month
- **Cloud Run**: $15-25/month
- **Savings**: 50-70%

## Additional Benefits
- ✅ Faster deployments
- ✅ Better resource utilization
- ✅ Automatic HTTPS
- ✅ Built-in load balancing
- ✅ No cold start penalty for HTTP requests
EOF

# 5. Create migration checklist
echo "📋 Creating migration checklist..."

cat > migration-checklist.md << 'EOF'
# 📋 App Engine to Cloud Run Migration Checklist

## Pre-Migration
- [ ] Test Dockerfile locally
- [ ] Verify all environment variables
- [ ] Check Cloud SQL connection
- [ ] Backup current deployment

## Migration Steps
1. [ ] Build and test Docker image locally
2. [ ] Deploy to Cloud Run in parallel
3. [ ] Update frontend API URLs to Cloud Run
4. [ ] Test all functionality
5. [ ] Update DNS/domain configuration
6. [ ] Monitor for 24-48 hours
7. [ ] Disable App Engine service

## Post-Migration
- [ ] Verify billing reduction
- [ ] Set up Cloud Run monitoring
- [ ] Configure error reporting
- [ ] Update deployment documentation

## Rollback Plan
- [ ] Keep App Engine service ready for quick rollback
- [ ] Document frontend URL changes needed for rollback
EOF

echo ""
echo "🎉 Cloud Run migration setup complete!"
echo ""
echo "📋 Next steps:"
echo "1. Review generated files:"
echo "   - tradetaper-backend/Dockerfile"
echo "   - tradetaper-backend/cloudrun.yaml"
echo "   - tradetaper-backend/deploy-cloudrun.sh"
echo ""
echo "2. Test migration:"
echo "   cd tradetaper-backend && ./deploy-cloudrun.sh"
echo ""
echo "3. Update frontend API URL to Cloud Run service URL"
echo ""
echo "💰 Expected savings: $30-40/month (50-70% reduction)" 