# 🚀 TradeTaper Admin - Production Deployment Guide

## 📋 **Overview**

This guide covers the complete production deployment of the TradeTaper admin system with:
- **Frontend & Admin**: Deployed on Vercel
- **Backend & Database**: Deployed on Railway
- **Enterprise-level configuration and monitoring**

## 🏗️ **Architecture Overview**

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │     Admin       │    │    Backend      │
│   (Vercel)      │    │   (Vercel)      │    │   (Railway)     │
│                 │    │                 │    │                 │
│ tradetaper-     │    │ tradetaper-     │    │ tradetaper-     │
│ frontend        │    │ admin           │    │ backend         │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         └───────────────────────┼───────────────────────┘
                                 │
                    ┌─────────────────┐
                    │   Database      │
                    │   (Railway)     │
                    │                 │
                    │ PostgreSQL      │
                    └─────────────────┘
```

## 🔧 **1. Railway Backend Deployment**

### **1.1 Database Setup**

1. **Create PostgreSQL Database on Railway**:
   ```bash
   # In Railway dashboard:
   # 1. Create new project
   # 2. Add PostgreSQL service
   # 3. Note the connection details
   ```

2. **Environment Variables for Backend**:
   ```env
   # Database (Railway will provide these)
   DATABASE_URL=postgresql://user:password@host:port/database
   
   # Application
   NODE_ENV=production
   PORT=3000
   
   # JWT Configuration
   JWT_SECRET=your-super-secret-jwt-key-minimum-32-characters-long
   JWT_EXPIRATION_TIME=24h
   
   # CORS Configuration
   FRONTEND_URL=https://your-frontend.vercel.app
   ADMIN_URL=https://your-admin.vercel.app
   
   # MetaAPI (if using)
   METAAPI_API_TOKEN=your_metaapi_token
   METAAPI_ENVIRONMENT=production
   
   # Stripe (if using)
   STRIPE_SECRET_KEY=sk_live_your_stripe_secret_key
   STRIPE_PUBLISHABLE_KEY=pk_live_your_stripe_publishable_key
   STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret
   ```

### **1.2 Backend Deployment**

1. **Connect Repository to Railway**:
   ```bash
   # In Railway dashboard:
   # 1. Create new service
   # 2. Connect GitHub repository
   # 3. Set root directory to "tradetaper-backend"
   # 4. Railway will auto-detect Node.js and deploy
   ```

2. **Build Configuration** (railway.toml):
   ```toml
   [build]
   builder = "nixpacks"
   buildCommand = "npm run build"
   
   [deploy]
   startCommand = "npm run start:prod"
   restartPolicyType = "always"
   
   [env]
   NODE_ENV = "production"
   ```

## 🌐 **2. Vercel Admin Deployment**

### **2.1 Environment Variables for Admin**

In Vercel dashboard, set these environment variables:

```env
# API Configuration
NEXT_PUBLIC_API_URL=https://your-backend.railway.app/api/v1

# Authentication
NEXTAUTH_SECRET=your-super-secret-nextauth-key-minimum-32-characters
NEXTAUTH_URL=https://your-admin.vercel.app

# Environment
NODE_ENV=production
```

### **2.2 Admin Deployment**

1. **Connect Repository to Vercel**:
   ```bash
   # In Vercel dashboard:
   # 1. Import project from GitHub
   # 2. Set root directory to "tradetaper-admin"
   # 3. Framework preset: Next.js
   # 4. Build command: npm run build
   # 5. Output directory: .next
   ```

2. **Build Configuration** (vercel.json):
   ```json
   {
     "buildCommand": "npm run build",
     "outputDirectory": ".next",
     "framework": "nextjs",
     "installCommand": "npm install"
   }
   ```

## 🔐 **3. Security Configuration**

### **3.1 CORS Setup**

Update backend CORS configuration:

```typescript
// In main.ts
app.enableCors({
  origin: [
    'https://your-frontend.vercel.app',
    'https://your-admin.vercel.app',
    // Add your custom domains
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
});
```

### **3.2 Environment Security**

1. **Secure JWT Secrets**:
   ```bash
   # Generate secure secrets
   openssl rand -base64 32
   ```

2. **Database Security**:
   - Enable SSL connections
   - Use connection pooling
   - Set up database backups

## 📊 **4. Monitoring & Analytics**

### **4.1 Railway Monitoring**

1. **Enable Railway Metrics**:
   - CPU usage monitoring
   - Memory usage tracking
   - Request/response metrics
   - Error rate monitoring

2. **Database Monitoring**:
   - Connection pool monitoring
   - Query performance tracking
   - Storage usage alerts

### **4.2 Vercel Analytics**

1. **Enable Vercel Analytics**:
   ```bash
   npm install @vercel/analytics
   ```

2. **Add to Admin App**:
   ```typescript
   // In _app.tsx or layout.tsx
   import { Analytics } from '@vercel/analytics/react';
   
   export default function App() {
     return (
       <>
         <YourApp />
         <Analytics />
       </>
     );
   }
   ```

## 🚨 **5. Health Checks & Alerts**

### **5.1 Backend Health Endpoint**

Already implemented in `/health` endpoint:

```typescript
@Get('health')
getHealth() {
  return {
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV,
  };
}
```

### **5.2 Monitoring Setup**

1. **Railway Alerts**:
   - Set up CPU/Memory alerts
   - Database connection alerts
   - Error rate thresholds

2. **External Monitoring** (Optional):
   - UptimeRobot for uptime monitoring
   - Sentry for error tracking
   - LogRocket for user session recording

## 🔄 **6. CI/CD Pipeline**

### **6.1 Automatic Deployments**

Both Vercel and Railway support automatic deployments:

1. **Vercel**: Auto-deploys on push to main branch
2. **Railway**: Auto-deploys on push to main branch

### **6.2 Environment-specific Deployments**

```bash
# Production branch: main
# Staging branch: staging
# Development: feature branches
```

## 📝 **7. Post-Deployment Checklist**

### **7.1 Verify Deployments**

- [ ] Backend health check: `https://your-backend.railway.app/health`
- [ ] Admin dashboard loads: `https://your-admin.vercel.app`
- [ ] Database connection working
- [ ] API endpoints responding correctly
- [ ] Authentication working
- [ ] Real-time features functioning

### **7.2 Test Admin Features**

- [ ] Dashboard analytics loading
- [ ] User management working
- [ ] Trade analytics displaying
- [ ] System management tools functional
- [ ] Testing suite operational
- [ ] Database viewer working
- [ ] Revenue management active
- [ ] Geographic analytics loading
- [ ] Activity monitoring live

### **7.3 Performance Verification**

- [ ] Page load times < 3 seconds
- [ ] API response times < 500ms
- [ ] Database queries optimized
- [ ] Real-time updates working
- [ ] Mobile responsiveness verified

## 🛠️ **8. Maintenance & Updates**

### **8.1 Regular Maintenance**

1. **Weekly**:
   - Check system health metrics
   - Review error logs
   - Monitor performance metrics

2. **Monthly**:
   - Update dependencies
   - Review security alerts
   - Backup verification

### **8.2 Scaling Considerations**

1. **Railway Scaling**:
   - Monitor resource usage
   - Scale up when CPU > 80%
   - Add read replicas for database

2. **Vercel Scaling**:
   - Automatic scaling included
   - Monitor function execution times
   - Optimize bundle sizes

## 🆘 **9. Troubleshooting**

### **9.1 Common Issues**

1. **CORS Errors**:
   ```bash
   # Check CORS configuration in backend
   # Verify frontend URLs in environment variables
   ```

2. **Database Connection Issues**:
   ```bash
   # Check DATABASE_URL format
   # Verify SSL settings
   # Check connection limits
   ```

3. **Authentication Problems**:
   ```bash
   # Verify JWT_SECRET matches between services
   # Check NEXTAUTH_URL configuration
   # Verify cookie settings
   ```

### **9.2 Debug Commands**

```bash
# Check Railway logs
railway logs

# Check Vercel logs
vercel logs

# Test API endpoints
curl https://your-backend.railway.app/health
```

## 📞 **10. Support & Resources**

### **10.1 Documentation Links**

- [Railway Documentation](https://docs.railway.app/)
- [Vercel Documentation](https://vercel.com/docs)
- [Next.js Deployment](https://nextjs.org/docs/deployment)
- [NestJS Production](https://docs.nestjs.com/deployment)

### **10.2 Monitoring Dashboards**

- Railway Dashboard: Monitor backend performance
- Vercel Dashboard: Monitor frontend performance
- Admin System Dashboard: Monitor application metrics

---

## 🎉 **Deployment Complete!**

Your TradeTaper admin system is now running in production with:

✅ **Enterprise-level architecture**  
✅ **Real-time monitoring and analytics**  
✅ **Comprehensive testing capabilities**  
✅ **Advanced debugging tools**  
✅ **Scalable infrastructure**  
✅ **Security best practices**  

The system is ready to handle production traffic and provide powerful admin capabilities for managing your TradeTaper platform. 