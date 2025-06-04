# 🚀 TradeTaper Complete Deployment Guide

This guide will walk you through deploying all three components of TradeTaper:
- **Backend**: Railway (Node.js + PostgreSQL)
- **Frontend**: Vercel (Next.js)
- **Admin Dashboard**: Vercel (Next.js)

## 📋 Prerequisites

1. **GitHub Account** - All code should be committed and pushed
2. **Railway Account** - For backend and database
3. **Vercel Account** - For frontend and admin dashboard
4. **Stripe Account** - For payment processing (live keys for production)

## 🗄️ Step 1: Deploy Backend to Railway

### 1.1 Prepare Repository
```bash
git add .
git commit -m "Prepare for deployment"
git push origin main
```

### 1.2 Deploy to Railway
1. Go to [Railway.app](https://railway.app)
2. Sign up/login with GitHub
3. Click "Deploy from GitHub repo"
4. Select your repository
5. Choose the `tradetaper-backend` folder as the root directory

### 1.3 Add PostgreSQL Database
1. In your Railway project dashboard
2. Click "New" → "Database" → "Add PostgreSQL"
3. Railway will automatically provide `DATABASE_URL`

### 1.4 Configure Environment Variables
In Railway dashboard → Your Backend Service → Variables, add:

```bash
NODE_ENV=production
PORT=3000

# Frontend URLs (update after deploying frontend)
FRONTEND_URL=https://your-frontend.vercel.app
ADMIN_URL=https://your-admin.vercel.app

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

# CORS Origins (update after deploying frontends)
CORS_ORIGINS=https://your-frontend.vercel.app,https://your-admin.vercel.app
```

### 1.5 Get Backend URL
After deployment, copy your Railway backend URL (e.g., `https://your-backend.railway.app`)

## 🌐 Step 2: Deploy Frontend to Vercel

### 2.1 Deploy to Vercel
1. Go to [Vercel.com](https://vercel.com)
2. Sign up/login with GitHub
3. Click "New Project"
4. Select your repository
5. Configure:
   - **Framework Preset**: Next.js
   - **Root Directory**: `tradetaper-frontend`
   - **Build Command**: `npm run build`
   - **Output Directory**: `.next`

### 2.2 Configure Environment Variables
**IMPORTANT**: Set these in Vercel dashboard → Settings → Environment Variables (NOT in vercel.json):

```bash
NEXT_PUBLIC_API_URL=https://your-backend.railway.app
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_your_live_stripe_publishable_key
```

**Steps to add environment variables:**
1. After deploying, go to your project in Vercel dashboard
2. Click "Settings" tab
3. Click "Environment Variables" in the sidebar
4. Add each variable:
   - **Name**: `NEXT_PUBLIC_API_URL`
   - **Value**: Your Railway backend URL (e.g., `https://tradetaper-backend-production.up.railway.app`)
   - **Environment**: Production, Preview, Development (select all)
5. Click "Save"
6. Repeat for `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`

### 2.3 Deploy
Click "Deploy" and wait for the build to complete.

## 📊 Step 3: Deploy Admin Dashboard to Vercel

### 3.1 Create New Vercel Project
1. In Vercel dashboard, click "New Project"
2. Select the same repository
3. Configure:
   - **Framework Preset**: Next.js
   - **Root Directory**: `tradetaper-admin`
   - **Build Command**: `npm run build`
   - **Output Directory**: `.next`

### 3.2 Configure Environment Variables
**IMPORTANT**: Set these in Vercel dashboard → Settings → Environment Variables:

```bash
NEXT_PUBLIC_API_URL=https://your-backend.railway.app
```

**Steps to add environment variables:**
1. After deploying, go to your project in Vercel dashboard
2. Click "Settings" tab
3. Click "Environment Variables" in the sidebar
4. Add the variable:
   - **Name**: `NEXT_PUBLIC_API_URL`
   - **Value**: Your Railway backend URL (e.g., `https://tradetaper-backend-production.up.railway.app`)
   - **Environment**: Production, Preview, Development (select all)
5. Click "Save"

### 3.3 Deploy
Click "Deploy" and wait for the build to complete.

## 🔄 Step 4: Update Backend CORS

After both frontends are deployed:

1. Go to Railway dashboard → Backend service → Variables
2. Update `FRONTEND_URL` and `ADMIN_URL` with your actual Vercel URLs
3. Update `CORS_ORIGINS` with both Vercel URLs

## 🔑 Step 5: Configure Stripe

### 5.1 Update Webhook Endpoint
1. Go to Stripe Dashboard → Webhooks
2. Add endpoint: `https://your-backend.railway.app/api/v1/webhooks/stripe`
3. Select events:
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_succeeded`
   - `invoice.payment_failed`
4. Copy webhook secret and update `STRIPE_WEBHOOK_SECRET` in Railway

### 5.2 Create Products (if not already done)
1. In Stripe Dashboard, create your subscription products
2. Copy price IDs and update them in your backend code

## 🧪 Step 6: Test Deployment

### 6.1 Backend Health Check
```bash
curl https://your-backend.railway.app/api/v1/health
```

### 6.2 Frontend Test
1. Visit your frontend Vercel URL
2. Test user registration/login
3. Test basic functionality

### 6.3 Admin Dashboard Test
1. Visit your admin Vercel URL
2. Test admin login (if implemented)
3. Verify dashboard loads

## 🔧 Step 7: Domain Configuration (Optional)

### 7.1 Custom Domains
1. In Vercel dashboard → Settings → Domains
2. Add your custom domains
3. Update CORS settings in Railway accordingly

## 📱 Step 8: Environment-Specific Configuration

### 8.1 Production Checklist
- ✅ Use live Stripe keys
- ✅ Set strong JWT_SECRET (min 32 characters)
- ✅ Enable SSL/HTTPS (automatic on Railway/Vercel)
- ✅ Configure proper CORS origins
- ✅ Set `NODE_ENV=production`
- ✅ Database migrations run automatically

### 8.2 Security Settings
- ✅ Disable TypeORM synchronize in production
- ✅ Use environment variables for all secrets
- ✅ Enable rate limiting
- ✅ Configure proper error handling

## 🚨 Troubleshooting

### Common Issues

1. **Build Failures**
   - Check TypeScript errors
   - Verify all dependencies are installed
   - Check environment variables

2. **Vercel Environment Variable Errors**
   ```
   Environment Variable "NEXT_PUBLIC_API_URL" references Secret "api_url", which does not exist.
   ```
   **Solution**: 
   - Don't set environment variables in `vercel.json`
   - Set them directly in Vercel dashboard → Settings → Environment Variables
   - Use the exact variable names: `NEXT_PUBLIC_API_URL`, `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`

3. **CORS Errors**
   - Verify CORS_ORIGINS includes your frontend URLs
   - Check FRONTEND_URL and ADMIN_URL variables

4. **Database Connection Issues**
   - Verify DATABASE_URL is set by Railway
   - Check database service is running

5. **Stripe Webhook Issues**
   - Verify webhook endpoint URL
   - Check webhook secret matches
   - Ensure selected events are correct

## 📊 Monitoring

### Railway Monitoring
- Check logs in Railway dashboard
- Monitor database performance
- Set up alerts for downtime

### Vercel Monitoring
- Check function logs
- Monitor build times
- Set up domain monitoring

## 💰 Cost Estimation

**Free Tier Limits:**
- Railway: 500 hours/month, 1GB RAM, 1GB storage
- Vercel: 100GB bandwidth, 6000 build minutes
- **Estimated Monthly Cost**: $0-10 (within free tiers for small apps)

## 🔄 Continuous Deployment

Both Railway and Vercel offer automatic deployments:
- **Railway**: Auto-deploys on push to main branch
- **Vercel**: Auto-deploys on push to main branch

## 📞 Support

If you encounter issues:
1. Check the logs in Railway/Vercel dashboards
2. Verify environment variables
3. Test API endpoints manually
4. Check database connectivity

---

**🎉 Congratulations!** Your TradeTaper application is now deployed and ready for production use! 