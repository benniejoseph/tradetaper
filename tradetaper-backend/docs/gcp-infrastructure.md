# TradeTaper GCP Infrastructure Configuration

## Cloud Run Optimization

### Recommended Settings

```yaml
# cloud-run-config.yaml
apiVersion: serving.knative.dev/v1
kind: Service
metadata:
  name: tradetaper-backend
spec:
  template:
    metadata:
      annotations:
        # Scale to zero when idle (cost savings)
        autoscaling.knative.dev/minScale: "0"
        autoscaling.knative.dev/maxScale: "5"
        # CPU allocation only during requests
        run.googleapis.com/cpu-throttling: "true"
        # Startup CPU boost for faster cold starts
        run.googleapis.com/startup-cpu-boost: "true"
    spec:
      containerConcurrency: 100
      timeoutSeconds: 60
      containers:
        - image: gcr.io/PROJECT_ID/tradetaper-backend
          resources:
            limits:
              cpu: "1"
              memory: "512Mi"
          env:
            - name: NODE_ENV
              value: production
```

### Cost Comparison

| Setting | Before | After | Savings |
|---------|--------|-------|---------|
| Min instances | 1 | 0 | 80-90% idle cost |
| Max instances | 10 | 5 | 50% peak cost |
| CPU | Always allocated | Request only | 60-70% |
| Concurrency | 80 | 100 | 20% fewer instances |

---

## Cloud SQL Optimization

### Development Environment

```sql
-- Downgrade to smallest instance for dev
gcloud sql instances patch tradetaper-dev \
  --tier=db-f1-micro \
  --storage-auto-increase-limit=10GB

-- Disable high availability for dev
gcloud sql instances patch tradetaper-dev \
  --no-availability-type
```

### Production Settings

```sql
-- Enable connection pooling
gcloud sql instances patch tradetaper-prod \
  --database-flags=max_connections=100

-- Reduce backup retention
gcloud sql instances patch tradetaper-prod \
  --backup-start-time=02:00 \
  --retained-backups-count=3
```

### Cost Comparison

| Setting | Before | After | Savings |
|---------|--------|-------|---------|
| Dev instance | db-g1-small | db-f1-micro | 75% |
| HA for dev | Enabled | Disabled | 50% |
| Backup retention | 7 days | 3 days | 40% |

---

## Caching with Memorystore (Optional)

If you need distributed caching:

```yaml
# For high-traffic production
gcloud redis instances create tradetaper-cache \
  --size=1 \
  --region=us-central1 \
  --redis-version=redis_7_0 \
  --tier=basic

# Cost: ~$35/month for 1GB Basic tier
```

### Alternative: Use Cloud Run's built-in memory
For lower traffic, the in-memory cache in Cloud Run is sufficient and free.

---

## Monitoring & Alerts

```bash
# Set up billing alerts
gcloud billing budgets create \
  --billing-account=BILLING_ACCOUNT_ID \
  --display-name="TradeTaper Monthly" \
  --budget-amount=100USD \
  --threshold-rules=percent=50 \
  --threshold-rules=percent=80 \
  --threshold-rules=percent=100

# Enable Cloud Monitoring
gcloud services enable monitoring.googleapis.com
```

---

## Quick Commands

```bash
# Check current Cloud Run config
gcloud run services describe tradetaper-backend --region=us-central1

# Update instance settings
gcloud run services update tradetaper-backend \
  --min-instances=0 \
  --max-instances=5 \
  --memory=512Mi \
  --cpu=1 \
  --concurrency=100 \
  --region=us-central1

# Check Cloud SQL status
gcloud sql instances describe tradetaper-db

# View recent costs
gcloud billing accounts list
```

---

## Estimated Monthly Savings

| Component | Before | After | Monthly Savings |
|-----------|--------|-------|-----------------|
| Cloud Run | $50-100 | $10-30 | $40-70 |
| Cloud SQL | $30-50 | $10-20 | $20-30 |
| Gemini API | $100+ | $5-10 | $90+ |
| **Total** | **$180-250** | **$25-60** | **$120-190** |
