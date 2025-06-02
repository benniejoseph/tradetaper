# 🚀 TradeTaper Deployment Guide

This guide will help you deploy your TradeTaper application to free hosting platforms.

## 📋 Deployment Architecture

**Recommended Free Tier Setup:**
- **Frontend**: Vercel (Next.js hosting)
- **Backend**: Railway (Node.js + PostgreSQL)
- **Database**: Railway PostgreSQL (included)
- **File Storage**: Vercel Blob or keep GCP Cloud Storage

## 🔧 Prerequisites

1. **GitHub Account** - for code repository
2. **Vercel Account** - for frontend hosting
3. **Railway Account** - for backend and database
4. **Stripe Account** - for payments (live keys for production)

## 🗄️ Backend Deployment (Railway)

### Step 1: Prepare Backend

1. **Commit your code to GitHub**:
```bash
cd tradetaper-backend
git add .
git commit -m "Prepare for deployment"
git push origin main
```

### Step 2: Deploy to Railway

1. Go to [Railway.app](https://railway.app)
2. Sign up/login with GitHub
3. Click "Deploy from GitHub repo"
4. Select your `tradetaper-backend` repository
5. Railway will automatically detect it's a Node.js project

### Step 3: Add PostgreSQL Database

1. In your Railway project dashboard
2. Click "New" → "Database" → "Add PostgreSQL"
3. Railway will automatically provide `DATABASE_URL`

### Step 4: Configure Environment Variables

In Railway dashboard, go to your backend service → Variables:

```bash
NODE_ENV=production
PORT=3000
FRONTEND_URL=https://your-app.vercel.app

# Database (Railway provides DATABASE_URL automatically)
# No need to set DB_* variables when using DATABASE_URL

# JWT Configuration
JWT_SECRET=your-super-secure-jwt-secret-for-production-min-32-chars
JWT_EXPIRATION_TIME=24h

# Stripe Configuration (LIVE keys for production!)
STRIPE_SECRET_KEY=sk_live_your_live_stripe_secret_key
STRIPE_PUBLISHABLE_KEY=pk_live_your_live_stripe_publishable_key
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret

# Optional APIs
TRADERMADE_API_KEY=your_tradermade_api_key
GCS_BUCKET_NAME=your-bucket-name
```

### Step 5: Update Stripe Webhooks

1. Go to Stripe Dashboard → Webhooks
2. Add endpoint: `https://your-backend.railway.app/api/v1/api/webhooks/stripe`
3. Select events and copy webhook secret to Railway environment

## 🌐 Frontend Deployment (Vercel)

### Step 1: Prepare Frontend

1. **Update API configuration**:
```bash
cd tradetaper-frontend
```

2. **Create `.env.local`** (for production, set in Vercel dashboard):
```bash
NEXT_PUBLIC_API_URL=https://your-backend.railway.app
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_your_live_stripe_publishable_key
```

### Step 2: Deploy to Vercel

1. Go to [Vercel.com](https://vercel.com)
2. Sign up/login with GitHub
3. Click "New Project"
4. Select your `tradetaper-frontend` repository
5. Configure:
   - **Framework Preset**: Next.js
   - **Root Directory**: tradetaper-frontend

### Step 3: Configure Environment Variables

In Vercel dashboard → Settings → Environment Variables:

```bash
NEXT_PUBLIC_API_URL=https://your-backend.railway.app
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_your_live_stripe_publishable_key
```

### Step 4: Update Backend CORS

Update your Railway backend's `FRONTEND_URL` environment variable:
```bash
FRONTEND_URL=https://your-app.vercel.app
```

## 📊 Database Setup

### Automatic Migration

Railway will automatically run your TypeORM synchronization on first deployment.

### Manual Database Setup (if needed)

If you need to manually run migrations:

1. Connect to Railway PostgreSQL:
```bash
# Get connection details from Railway dashboard
psql postgresql://user:password@host:port/database
```

2. Create tables manually if needed (TypeORM should handle this automatically)

## 🔑 Production Configuration

### Stripe Live Mode

1. **Get Live API Keys**:
   - Go to Stripe Dashboard
   - Switch to "Live mode"
   - Copy your live keys

2. **Update Environment Variables**:
   - Railway: Update backend `STRIPE_SECRET_KEY`
   - Vercel: Update frontend `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`

3. **Create Products in Stripe**:
   - Create your subscription products
   - Update price IDs in `subscription.service.ts`

### Security Checklist

- ✅ Use live Stripe keys
- ✅ Set strong JWT_SECRET (min 32 characters)
- ✅ Enable SSL/HTTPS (automatic on Railway/Vercel)
- ✅ Configure proper CORS origins
- ✅ Set `NODE_ENV=production`
- ✅ Disable TypeORM synchronize in production

## 🛠️ Alternative Platforms

### Option 2: Render + Vercel

**Backend on Render:**
1. Go to [Render.com](https://render.com)
2. Create new "Web Service"
3. Connect GitHub repository
4. Add PostgreSQL database
5. Configure environment variables

**Settings:**
- **Build Command**: `npm install && npm run build`
- **Start Command**: `npm run start:prod`

### Option 3: Heroku + Vercel

**Backend on Heroku:**
1. Create Heroku app
2. Add Heroku PostgreSQL addon
3. Configure environment variables
4. Deploy via GitHub integration

## 📱 Testing Deployment

### Backend Health Check
```bash
curl https://your-backend.railway.app/api/v1
```

### Frontend Test
1. Visit your Vercel URL
2. Test user registration/login
3. Test Stripe integration (use test cards)

## 🔄 Continuous Deployment

Both Railway and Vercel offer automatic deployments:

1. **Push to main branch** → Automatic deployment
2. **Pull requests** → Preview deployments
3. **Environment-specific branches** supported

## 📈 Monitoring & Logs

### Railway
- Built-in logs and metrics
- Real-time log streaming
- Uptime monitoring

### Vercel
- Built-in analytics
- Function logs
- Performance insights

## 💰 Free Tier Limits

### Railway
- **$5/month** credit (enough for small apps)
- **512MB RAM**
- **1GB storage**
- **100GB bandwidth**

### Vercel
- **100GB bandwidth**
- **Unlimited static hosting**
- **Serverless functions**

### Optimization Tips
- Use Next.js static generation where possible
- Optimize images (Next.js Image component)
- Enable caching headers
- Minimize bundle size

## 🆘 Troubleshooting

### Common Issues

1. **Database Connection Error**
   - Check `DATABASE_URL` format
   - Verify SSL settings in production

2. **CORS Errors**
   - Update `FRONTEND_URL` in backend
   - Check allowed origins in main.ts

3. **Environment Variables**
   - Restart services after updating variables
   - Check variable names (case-sensitive)

4. **Build Failures**
   - Check TypeScript errors
   - Verify all dependencies are listed

### Getting Help

- **Railway**: Check logs in dashboard
- **Vercel**: Check function logs and build logs
- **Database**: Use Railway's built-in database browser

## 🎉 Congratulations!

Your TradeTaper application is now live on free hosting platforms! 

**Next Steps:**
1. Set up custom domain (optional)
2. Configure monitoring and alerts
3. Set up backups
4. Plan for scaling as your user base grows

**Estimated Monthly Cost**: $0-5 (within free tiers) 