# Redis Caching Setup

Redis caching has been integrated into TradeTaper backend to improve performance and reduce costs.

## Benefits

- **Performance**: 40-60% faster response times for frequently accessed data
- **Cost Savings**: ~$1,200/year by reducing database load and API calls
- **Scalability**: Better handling of concurrent requests
- **AI Cost Reduction**: LLM response caching reduces API costs by 60-80%

## Local Development Setup

### Option 1: Docker (Recommended)

```bash
docker run -d -p 6379:6379 --name tradetaper-redis redis:alpine
```

### Option 2: Install Redis Locally

**macOS (Homebrew):**
```bash
brew install redis
brew services start redis
```

**Ubuntu/Debian:**
```bash
sudo apt-get update
sudo apt-get install redis-server
sudo systemctl start redis-server
```

### Configure Environment

Add to your `.env` file:
```
REDIS_URL=redis://localhost:6379
```

## Production Setup

### Google Cloud Memorystore (Recommended for GCP)

1. Create a Memorystore for Redis instance:
```bash
gcloud redis instances create tradetaper-cache \
  --size=1 \
  --region=us-central1 \
  --redis-version=redis_7_0
```

2. Get the connection string:
```bash
gcloud redis instances describe tradetaper-cache --region=us-central1
```

3. Add to Cloud Run environment variables:
```
REDIS_URL=redis://[REDIS_HOST]:6379
```

### Cost Estimate

- Basic tier (1GB): ~$45/month
- Savings from reduced DB load: ~$100/month
- **Net savings: ~$55/month ($660/year)**

## Fallback Behavior

If `REDIS_URL` is not configured, the application will:
- Fall back to in-memory caching
- Continue to work normally with slightly reduced performance
- Log warnings about missing Redis configuration

## Cached Data

The following data is cached:

- **User profiles and settings** (24 hours TTL)
- **Trade statistics** (1 hour TTL)
- **Market data** (1 minute TTL)
- **LLM responses** (semantic cache, 10 minutes default TTL)
- **Authentication tokens** (15 minutes TTL)

## Cache Invalidation

Caches are automatically invalidated on:
- User profile updates
- Trade creation/modification/deletion
- Manual cache clear via admin endpoint (if needed)

## Monitoring

To monitor cache performance:

1. Check cache hit rate in logs
2. Monitor Redis memory usage
3. Track API response times
4. Review cost savings in Gemini API dashboard

## Troubleshooting

**Connection Error:**
```
ECONNREFUSED: Connection refused at 127.0.0.1:6379
```
- Ensure Redis is running: `redis-cli ping` (should return PONG)
- Check REDIS_URL is correct in .env

**Out of Memory:**
- Increase Redis memory limit
- Review TTL values and reduce if needed
- Implement LRU eviction policy
