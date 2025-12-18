# 🚀 Quick Deployment Guide - TradeTaper

## Current Production URLs

### 🌐 Frontend
**https://tradetaper-frontend-a9lealonn-benniejosephs-projects.vercel.app**

### 🔧 Backend  
**https://tradetaper-backend-326520250422.us-central1.run.app/api/v1**

---

## Making Changes & Deploying

### Frontend Changes

```bash
cd /Users/benniejoseph/Documents/TradeTaper/tradetaper-frontend

# Make your changes to files...

# Deploy directly to production
vercel --prod --yes
```

That's it! Vercel will:
1. Upload your changes
2. Build the Next.js app
3. Deploy to production
4. Give you the live URL

### Backend Changes

```bash
cd /Users/benniejoseph/Documents/TradeTaper/tradetaper-backend

# Make your changes to files...

# Deploy to Cloud Run
./deploy-cloudrun.sh
```

The script handles:
1. Building Docker image
2. Pushing to Google Container Registry
3. Deploying to Cloud Run
4. Setting all environment variables

---

## Quick Commands

### Check Frontend Status
```bash
cd tradetaper-frontend
vercel ls --prod
```

### Check Backend Status
```bash
gcloud run services describe tradetaper-backend --region us-central1 --format="get(status.url)"
```

### View Backend Logs
```bash
gcloud logging read "resource.type=cloud_run_revision AND resource.labels.service_name=tradetaper-backend" --limit 50 --format json
```

### Test Backend Health
```bash
curl https://tradetaper-backend-326520250422.us-central1.run.app/api/v1/health
```

### Test Frontend
Just open: https://tradetaper-frontend-a9lealonn-benniejosephs-projects.vercel.app

---

## Environment Variables

### Frontend (.env.production)
- `NEXT_PUBLIC_API_URL`: Backend URL
- Automatically loaded from `.env.production` file

### Backend (Cloud Run)
- All variables set in `env-vars.yaml`
- Deployed automatically via `deploy-cloudrun.sh`
- Includes TradingView credentials, API keys, database config

---

## Troubleshooting

### Frontend won't deploy
```bash
cd tradetaper-frontend
rm -rf .vercel .next node_modules
npm install
vercel --prod --yes
```

### Backend won't deploy
```bash
cd tradetaper-backend
# Check if Docker is running
docker ps

# Rebuild and deploy
./deploy-cloudrun.sh
```

### Can't see changes
- Frontend: Wait 1-2 minutes for Vercel build
- Backend: Wait 2-3 minutes for Cloud Run deployment
- Clear browser cache: Cmd+Shift+R (Mac) or Ctrl+Shift+R (Windows)

---

## Important Files

### Frontend
- `src/app/(app)/dashboard/page.tsx` - Dashboard page
- `src/app/(app)/market-intelligence/page.tsx` - Market Intelligence
- `.env.production` - Production environment variables
- `vercel.json` - Vercel configuration

### Backend
- `deploy-cloudrun.sh` - Deployment script
- `env-vars.yaml` - Environment variables
- `.env` - Local environment variables (not deployed)
- `Dockerfile` - Container configuration

---

## Common Tasks

### Update API URL (Frontend)
1. Edit `tradetaper-frontend/.env.production`
2. Change `NEXT_PUBLIC_API_URL`
3. Run `vercel --prod --yes`

### Add New Environment Variable (Backend)
1. Edit `tradetaper-backend/env-vars.yaml`
2. Run `./deploy-cloudrun.sh`

### View Deployment Logs
```bash
# Frontend (in browser)
# Go to: https://vercel.com/benniejosephs-projects/tradetaper-frontend-new

# Backend
gcloud run services logs read tradetaper-backend --region us-central1 --limit 100
```

---

## Project Structure

```
TradeTaper/
├── tradetaper-frontend/       # Next.js frontend
│   ├── src/
│   │   └── app/
│   │       └── (app)/
│   │           ├── dashboard/
│   │           └── market-intelligence/
│   ├── .env.production
│   └── vercel.json
│
├── tradetaper-backend/        # NestJS backend
│   ├── src/
│   │   └── market-intelligence/
│   │       ├── ict/          # ICT analysis
│   │       └── tradingview/  # TradingView integration
│   ├── deploy-cloudrun.sh
│   ├── env-vars.yaml
│   └── Dockerfile
│
└── Documentation files
```

---

## Need Help?

1. **Vercel Issues**: Check https://vercel.com/benniejosephs-projects
2. **Cloud Run Issues**: Check Google Cloud Console
3. **Database Issues**: Check Cloud SQL in Google Cloud Console
4. **API Issues**: Check backend logs with `gcloud run services logs`

---

## Success Checklist

Before considering deployment successful:

- [ ] Frontend loads without errors
- [ ] Dashboard shows trades correctly
- [ ] Market Intelligence displays ICT analysis
- [ ] Backend health check returns success
- [ ] Database queries work
- [ ] TradingView data is updating
- [ ] No console errors in browser
- [ ] API calls return expected data

---

**Last Updated**: October 11, 2025  
**Status**: ✅ All systems operational


