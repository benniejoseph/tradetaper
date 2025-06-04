# 🌐 Vercel Deployment Quick Reference

## Frontend Deployment

### 1. Deploy to Vercel
1. Go to [Vercel.com](https://vercel.com)
2. Click "New Project"
3. Select repository: `benniejoseph/tradetaper`
4. **Root Directory**: `tradetaper-frontend`
5. Click "Deploy"

### 2. Set Environment Variables
After deployment, go to project → Settings → Environment Variables:

```
NEXT_PUBLIC_API_URL = https://your-backend.railway.app
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY = pk_live_your_stripe_key
```

## Admin Dashboard Deployment

### 1. Deploy to Vercel
1. In Vercel, click "New Project" 
2. Select repository: `benniejoseph/tradetaper`
3. **Root Directory**: `tradetaper-admin`
4. Click "Deploy"

### 2. Set Environment Variables
After deployment, go to project → Settings → Environment Variables:

```
NEXT_PUBLIC_API_URL = https://your-backend.railway.app
```

## ⚠️ Important Notes

- **DO NOT** set environment variables in `vercel.json`
- Set them directly in Vercel dashboard
- Select all environments (Production, Preview, Development)
- After adding variables, redeploy if needed

## 🔄 Redeploy After Changes

If you add/change environment variables:
1. Go to Deployments tab
2. Click "..." on latest deployment
3. Click "Redeploy"

## 🔗 Example URLs

After deployment, your URLs will look like:
- Frontend: `https://your-frontend.vercel.app`
- Admin: `https://your-admin.vercel.app`

Update these URLs in your Railway backend environment variables! 