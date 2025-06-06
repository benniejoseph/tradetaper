# TradeTaper Production Deployment Guide

## 🌐 Production MT5 Integration Strategy

When hosting TradeTaper in production, the local file-based MT5 integration won't work since users' MT5 terminals are on their local machines while your backend is on a remote server. Here's how to implement MT5 integration for production:

## 📋 Option 1: MetaApi Cloud Service (Recommended)

MetaApi provides cloud-based MT5 connectivity that works perfectly for hosted applications.

### Step 1: Setup MetaApi Account

1. **Sign up for MetaApi**:
   - Visit [metaapi.cloud](https://metaapi.cloud)
   - Create an account
   - Get your API token from the dashboard

2. **Choose your plan**:
   - **Free Tier**: 1 account, good for testing
   - **Paid Plans**: Multiple accounts, production ready
   - **Enterprise**: High-frequency trading, custom solutions

### Step 2: Configure Environment Variables

Add these to your production environment:

```bash
# Production Environment Variables
NODE_ENV=production

# MetaApi Configuration
METAAPI_TOKEN=your_metaapi_token
METAAPI_REGION=new-york  # or london, singapore
METAAPI_ENVIRONMENT=live  # or demo

# Disable local MT5 features
MT5_MOCK_MODE=false
```

### Step 3: Update Your Backend

The backend automatically detects MetaApi configuration and uses it in production:

```typescript
// Automatic production detection
if (NODE_ENV === 'production' && METAAPI_TOKEN) {
  // Uses MetaApi cloud service
  connectionType = 'metaapi'
} else {
  // Uses local file-based or mock mode
  connectionType = 'file'
}
```

### Step 4: User Flow in Production

1. **User adds MT5 account**: Same UI as development
2. **Backend creates MetaApi connection**: Account deployed to cloud
3. **Real-time synchronization**: Account data synced from broker
4. **Live data display**: User sees real balance and trades

## 🔧 Implementation Details

### Backend Service Integration

```typescript
// Production MT5 service automatically handles:
- Account creation via MetaApi
- Real-time data synchronization
- Trade history import
- Connection health monitoring
- Automatic reconnection
```

### Data Flow in Production

```
User's MT5 Broker → MetaApi Cloud → Your Backend → Frontend
        ↓              ↓              ↓          ↓
   Real Account → Cloud Sync → API Data → Dashboard
```

### Frontend Changes

No frontend changes needed! The existing UI works identically:

- ✅ Same account creation form
- ✅ Same account selector
- ✅ Same dashboard display
- ✅ Same trade viewing
- ✅ Real-time updates work automatically

## 📊 Option 2: Direct Broker APIs

Some brokers provide direct APIs for MT5 integration:

### MetaQuotes Web API
```typescript
// Example for brokers supporting Web API
const response = await fetch(`https://broker-api.com/accounts/${login}`, {
  headers: {
    'Authorization': `Bearer ${apiKey}`,
    'Content-Type': 'application/json'
  }
});
```

### Broker-Specific SDKs
```typescript
// Some brokers provide TypeScript/Node.js SDKs
import { BrokerAPI } from '@broker/mt5-sdk';

const api = new BrokerAPI({
  apiKey: process.env.BROKER_API_KEY,
  environment: 'live'
});
```

## 🚀 Deployment Platforms

### Option A: Cloud Platforms (Recommended)

#### Vercel
```bash
# Install Vercel CLI
npm i -g vercel

# Configure environment variables
vercel env add METAAPI_TOKEN
vercel env add NODE_ENV production

# Deploy
vercel --prod
```

#### AWS/Google Cloud/Azure
```yaml
# docker-compose.yml for cloud deployment
version: '3.8'
services:
  backend:
    build: ./tradetaper-backend
    environment:
      - NODE_ENV=production
      - METAAPI_TOKEN=${METAAPI_TOKEN}
      - DATABASE_URL=${DATABASE_URL}
    ports:
      - "3000:3000"
  
  frontend:
    build: ./tradetaper-frontend
    environment:
      - NEXT_PUBLIC_API_URL=https://your-api.com
    ports:
      - "3001:3001"
```

#### Railway/Render/Heroku
```bash
# Set environment variables in platform dashboard
METAAPI_TOKEN=your_token
NODE_ENV=production
DATABASE_URL=postgresql://...
```

### Option B: VPS Deployment

```bash
# Production deployment script
#!/bin/bash

# Clone repository
git clone https://github.com/yourusername/tradetaper.git
cd tradetaper

# Backend setup
cd tradetaper-backend
npm install
npm run build

# Frontend setup
cd ../tradetaper-frontend
npm install
npm run build

# Start with PM2
pm2 start ecosystem.config.js --env production
```

## ⚙️ Production Configuration

### Environment Variables

```bash
# Core Configuration
NODE_ENV=production
PORT=3000
FRONTEND_URL=https://yourdomain.com

# Database
DATABASE_URL=postgresql://user:pass@host:5432/tradetaper

# Authentication
JWT_SECRET=your_super_secure_jwt_secret
JWT_EXPIRES_IN=7d

# MetaApi Integration
METAAPI_TOKEN=your_metaapi_token
METAAPI_REGION=new-york
METAAPI_ENVIRONMENT=live

# File Storage (GCP/AWS/etc)
GCP_PROJECT_ID=your_project
GCP_BUCKET_NAME=tradetaper-files
GCP_CREDENTIALS_PATH=./credentials.json

# Optional: Webhook for real-time updates
WEBHOOK_SECRET=your_webhook_secret
```

### Database Migrations

```bash
# Run migrations in production
npm run typeorm migration:run

# Seed initial data
npm run seed:prod
```

### SSL/HTTPS Setup

```nginx
# Nginx configuration
server {
    listen 443 ssl;
    server_name yourdomain.com;
    
    ssl_certificate /path/to/cert.pem;
    ssl_certificate_key /path/to/key.pem;
    
    location /api {
        proxy_pass http://localhost:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
    
    location / {
        proxy_pass http://localhost:3001;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

## 🔒 Security Considerations

### API Security
```typescript
// Rate limiting
import rateLimit from 'express-rate-limit';

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
});

app.use('/api/', limiter);
```

### Environment Security
```bash
# Use environment variable managers
# Never commit secrets to git
# Rotate API keys regularly
# Use HTTPS everywhere
# Implement proper CORS
```

### Data Protection
```typescript
// Encrypt sensitive data
import { encrypt, decrypt } from './utils/encryption';

// Store encrypted MT5 passwords
const encryptedPassword = encrypt(password);
await mt5Account.save({ password: encryptedPassword });
```

## 📈 Monitoring & Logging

### Production Logging
```typescript
// Use structured logging
import winston from 'winston';

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
  transports: [
    new winston.transports.File({ filename: 'error.log', level: 'error' }),
    new winston.transports.File({ filename: 'combined.log' }),
  ],
});
```

### Health Checks
```typescript
// Health check endpoint
@Get('/health')
async healthCheck() {
  return {
    status: 'ok',
    timestamp: new Date().toISOString(),
    services: {
      database: await this.checkDatabase(),
      metaapi: await this.checkMetaApi(),
      redis: await this.checkRedis(),
    }
  };
}
```

### Metrics & Analytics
```typescript
// Track important metrics
import { Counter, Histogram } from 'prom-client';

const mt5ConnectionsCounter = new Counter({
  name: 'mt5_connections_total',
  help: 'Total number of MT5 connections',
  labelNames: ['status', 'provider']
});

const tradeImportDuration = new Histogram({
  name: 'trade_import_duration_seconds',
  help: 'Duration of trade import operations'
});
```

## 🚀 Migration from Development

### Step 1: Test with Demo Accounts
```bash
# Use demo environment first
METAAPI_ENVIRONMENT=demo
```

### Step 2: Gradual Rollout
```typescript
// Feature flag for production MT5
const useProductionMT5 = process.env.ENABLE_PRODUCTION_MT5 === 'true';

if (useProductionMT5) {
  // Use MetaApi
} else {
  // Use local/mock mode
}
```

### Step 3: Monitor & Validate
```bash
# Monitor logs for issues
tail -f /var/log/tradetaper/production.log

# Check MetaApi status
curl -H "auth-token: $METAAPI_TOKEN" \
  https://mt-provisioning-api-v1.new-york.agiliumtrade.ai/users/current
```

## 💡 Cost Optimization

### MetaApi Pricing
- **Free**: 1 account, basic features
- **Starter**: $49/month, 10 accounts
- **Professional**: $149/month, 50 accounts
- **Enterprise**: Custom pricing

### Cost Reduction Tips
```typescript
// Cache account data to reduce API calls
const cached = await redis.get(`account:${accountId}`);
if (cached) return JSON.parse(cached);

// Batch operations
const accounts = await metaApi.getAccounts();
const promises = accounts.map(acc => metaApi.getAccountInfo(acc.id));
const results = await Promise.all(promises);

// Use webhooks for real-time updates instead of polling
app.post('/webhook/metaapi', (req, res) => {
  const { accountId, event, data } = req.body;
  // Update account data in real-time
});
```

## 📞 Support & Troubleshooting

### Common Issues
1. **MetaApi Rate Limits**: Implement exponential backoff
2. **Account Sync Failures**: Check broker connection
3. **Data Inconsistencies**: Validate with broker directly
4. **Performance Issues**: Use caching and connection pooling

### Getting Help
- **MetaApi Support**: [support@metaapi.cloud](mailto:support@metaapi.cloud)
- **Documentation**: [docs.metaapi.cloud](https://docs.metaapi.cloud)
- **Community**: MetaApi Discord/Telegram

---

**With this production setup, your users can connect their real MT5 accounts and see their actual $98,000 balance and trading history, regardless of where your application is hosted!** 