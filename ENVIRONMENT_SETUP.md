# TradeTaper Environment Setup Guide

This guide will help you set up the TradeTaper project for both local development and production deployment.

## 🏗️ Project Structure

TradeTaper consists of three main applications:

- **Backend** (`tradetaper-backend/`) - NestJS API server (Port 3000)
- **Frontend** (`tradetaper-frontend/`) - Next.js user application (Port 3001)
- **Admin** (`tradetaper-admin/`) - Next.js admin dashboard (Port 3002)

## 🚀 Quick Setup

### 1. Automated Setup (Recommended)

Run the automated setup script to create all environment files:

```bash
# Make the setup script executable
chmod +x setup-dev-env.sh

# Run the setup script
./setup-dev-env.sh
```

### 2. Start All Services

```bash
# Make the start script executable
chmod +x start-dev-all.sh

# Start all services
./start-dev-all.sh
```

## 📁 Environment Files Overview

### Backend (.env)

Located at: `tradetaper-backend/.env`

```env
# Database Configuration
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=your_db_username
DB_PASSWORD=your_db_password
DB_DATABASE=tradetaper_dev

# Application Configuration
NODE_ENV=development
PORT=3000

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-here-make-it-long-and-random
JWT_EXPIRATION_TIME=24h

# Stripe Configuration
STRIPE_SECRET_KEY=sk_test_your_stripe_secret_key_here
STRIPE_PUBLISHABLE_KEY=pk_test_your_stripe_publishable_key_here
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret_here

# Frontend URL for CORS
FRONTEND_URL=http://localhost:3001

# TraderMade API
TRADERMADE_API_KEY=your_tradermade_api_key_here

# Google Cloud Storage (Optional)
GCS_BUCKET_NAME=your-bucket-name
```

### Frontend (.env.local)

Located at: `tradetaper-frontend/.env.local`

```env
# API Configuration
NEXT_PUBLIC_API_URL=http://localhost:3000/api/v1
NEXT_PUBLIC_BACKEND_URL=http://localhost:3000
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_your_stripe_publishable_key_here

# Application Configuration
NEXT_PUBLIC_APP_ENV=development
NEXT_PUBLIC_APP_NAME=TradeTaper
NEXT_PUBLIC_APP_VERSION=1.0.0
NEXT_PUBLIC_ENABLE_WEBSOCKETS=true
NEXT_PUBLIC_DEBUG=false
```

### Admin Dashboard (.env.local)

Located at: `tradetaper-admin/.env.local`

```env
# API Configuration
NEXT_PUBLIC_API_URL=http://localhost:3000/api/v1

# Application Configuration
NEXT_PUBLIC_APP_NAME=TradeTaper Admin Dashboard
NEXT_PUBLIC_APP_VERSION=1.0.0
NEXT_PUBLIC_DASHBOARD_REFRESH_INTERVAL=30
NEXT_PUBLIC_ENABLE_REALTIME=true
NEXT_PUBLIC_DEBUG=false
```

## 🌐 Port Configuration

| Service | Local Port | Production URL |
|---------|------------|----------------|
| Backend | 3000 | Railway deployment |
| Frontend | 3001 | Vercel deployment |
| Admin | 3002 | Vercel deployment |

## 🔧 Manual Setup

If you prefer to set up environment files manually:

### 1. Backend Environment

```bash
# Copy the template
cp tradetaper-backend/env.example tradetaper-backend/.env

# Edit the file with your configuration
nano tradetaper-backend/.env
```

### 2. Frontend Environment

```bash
# Copy the template
cp tradetaper-frontend/env.example tradetaper-frontend/.env.local

# Edit the file with your configuration
nano tradetaper-frontend/.env.local
```

### 3. Admin Environment

```bash
# Copy the template
cp tradetaper-admin/.env.example tradetaper-admin/.env.local

# Edit the file with your configuration
nano tradetaper-admin/.env.local
```

## 🔑 Required API Keys

### Stripe (Required for payments)
1. Go to [Stripe Dashboard](https://dashboard.stripe.com)
2. Get your test keys:
   - Publishable key (starts with `pk_test_`)
   - Secret key (starts with `sk_test_`)
3. Set up webhooks for webhook secret

### TraderMade (Optional - for market data)
1. Go to [TraderMade](https://tradermade.com)
2. Sign up and get your API key
3. Add to backend `.env` file

### Google Cloud Storage (Optional - for file uploads)
1. Create a GCS bucket
2. Generate service account credentials
3. Add credentials to backend `.env` file

## 🚨 Production Configuration

### Vercel (Frontend & Admin)

Set these environment variables in your Vercel dashboard:

**Frontend:**
```
NEXT_PUBLIC_API_URL=https://your-backend.railway.app/api/v1
NEXT_PUBLIC_BACKEND_URL=https://your-backend.railway.app
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_your_live_key
```

**Admin:**
```
NEXT_PUBLIC_API_URL=https://your-backend.railway.app/api/v1
```

### Railway (Backend)

Set these environment variables in your Railway dashboard:

```
NODE_ENV=production
PORT=3000
DATABASE_URL=postgresql://user:pass@host:port/db
JWT_SECRET=your-production-jwt-secret
STRIPE_SECRET_KEY=sk_live_your_live_key
FRONTEND_URL=https://your-frontend.vercel.app
```

## 🔍 Troubleshooting

### Common Issues

1. **CORS Errors**
   - Ensure `FRONTEND_URL` is correctly set in backend
   - Check that frontend is running on the expected port

2. **API Connection Failed**
   - Verify `NEXT_PUBLIC_API_URL` matches backend URL
   - Ensure backend is running before starting frontend/admin

3. **Environment Variables Not Loading**
   - Next.js requires `.env.local` for local development
   - Backend uses `.env` file
   - Restart servers after changing environment variables

4. **Port Conflicts**
   - Default ports: Backend (3000), Frontend (3001), Admin (3002)
   - Change ports in `package.json` scripts if needed

### Debug Steps

1. **Check if servers are running:**
   ```bash
   curl http://localhost:3000/api/v1/health  # Backend
   curl http://localhost:3001                # Frontend
   curl http://localhost:3002                # Admin
   ```

2. **View environment variables:**
   ```bash
   # In backend
   node -e "console.log(process.env.NODE_ENV)"
   
   # In frontend/admin (browser console)
   console.log(process.env.NEXT_PUBLIC_API_URL)
   ```

3. **Check logs:**
   ```bash
   # Backend logs
   tail -f tradetaper-backend/backend.log
   
   # Frontend/Admin logs in terminal where they're running
   ```

## 📚 Additional Resources

- [Stripe Testing Guide](https://stripe.com/docs/testing)
- [Next.js Environment Variables](https://nextjs.org/docs/basic-features/environment-variables)
- [NestJS Configuration](https://docs.nestjs.com/techniques/configuration)

## 🆘 Getting Help

If you encounter issues:

1. Check this documentation first
2. Verify all environment files exist and have correct values
3. Ensure all required services (database, etc.) are running
4. Check the GitHub issues for similar problems

Remember: Never commit real API keys or production secrets to version control!

## MetaTrader 5 Integration

The application supports MetaTrader 5 integration for automatically importing trading data. For production deployments, you should set the following environment variables for secure MT5 account integration:

```
# MT5 Integration Configuration
MT5_ENCRYPTION_KEY=your_32_byte_encryption_key_in_hex
MT5_ENCRYPTION_IV=your_16_byte_initialization_vector_in_hex
```

These values are used to encrypt/decrypt sensitive MT5 account data like passwords. In development mode, if these values are not provided, random values will be generated on server start (not recommended for production).

To generate secure values for production, you can use the following Node.js script:

```javascript
const crypto = require('crypto');
console.log('MT5_ENCRYPTION_KEY=' + crypto.randomBytes(32).toString('hex'));
console.log('MT5_ENCRYPTION_IV=' + crypto.randomBytes(16).toString('hex'));
```

For complete security in production, these values should be stored in a secure vault like AWS Secrets Manager or similar service, not directly in environment variables. 