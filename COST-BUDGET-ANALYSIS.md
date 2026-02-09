# TradeTaper - Cost & Budget Analysis

**Date**: February 9, 2026
**Analysis Period**: Monthly
**Currency**: USD

---

## 📊 Executive Summary

| Category | Monthly Cost | Annual Cost | Notes |
|----------|--------------|-------------|-------|
| **GCP Services** | $78.19 | $938.28 | Compute, Cloud Run, Redis |
| **External Services** | $25.00 | $300.00 | Supabase, APIs |
| **Domain & DNS** | $1.00 | $12.00 | Domain registration |
| **Buffer (20%)** | $20.84 | $250.06 | Unexpected usage |
| **TOTAL ESTIMATED** | **$125.03** | **$1,500.34** | All services |

**Current Usage Level**: Low-Medium (MVP/Early Stage)
**Scaling Potential**: 10-50x before major cost increases

---

## 🔍 Detailed Cost Breakdown

### 1. Google Cloud Platform (GCP)

#### A. Cloud Run Services ($40-60/month)

**tradetaper-backend**
- Configuration: 1 vCPU, 1GB RAM, 300s timeout
- Estimated requests: ~100,000/month
- Instance hours: ~730 hours (always on)
- **Cost Breakdown**:
  - CPU: 730 hours × $0.00002400/vCPU-second = **$42.05/month**
  - Memory: 730 hours × $0.00000250/GB-second = **$4.56/month**
  - Requests: 100,000 × $0.40/million = **$0.04/month**
  - **Subtotal**: **~$46.65/month**

**centhios-ai** (Secondary service)
- Configuration: 1 vCPU, 512MB RAM
- Estimated usage: Lower traffic
- **Estimated Cost**: **~$23/month**

**Total Cloud Run**: **$69.65/month** ($835.80/year)

#### B. Redis (Memorystore) ($11.68/month)

**tradetaper-cache**
- Tier: Basic
- Size: 1GB
- Region: us-central1
- Pricing: $0.016/GB/hour
- **Calculation**: 1GB × $0.016/hour × 730 hours = **$11.68/month**
- **Annual**: **$140.16**

**Features Included**:
- ✅ High availability in single zone
- ✅ Automatic failover
- ✅ 99.9% SLA
- ✅ Sub-millisecond latency

**Upgrade Path**:
- Standard tier (multi-zone): $0.032/GB/hour (~$23/month for 1GB)

#### C. VPC Connector ($14.60/month)

**trade-taper-connector**
- Machine Type: e2-micro
- Min Instances: 2
- Max Instances: 10
- Pricing: $0.01/hour per instance
- **Calculation**: 2 instances × $0.01/hour × 730 hours = **$14.60/month**
- **Annual**: **$175.20**

**Scaling Cost**:
- Under high load (5 avg instances): **$36.50/month**
- At max (10 instances): **$73.00/month**

#### D. Compute Engine VM ($7.11/month)

**tradetaper-terminal** (MT5 Terminal)
- Machine Type: e2-micro (0.25 vCPU, 1GB RAM)
- Disk: 30GB standard persistent disk
- Region: us-central1
- **Cost Breakdown**:
  - VM: $0.008387/hour × 730 hours = **$6.12/month**
  - Disk: 30GB × $0.04/GB/month = **$1.20/month**
  - Network: Minimal (<$0.50/month)
  - **Subtotal**: **~$7.11/month**
- **Annual**: **$85.32**

**Note**: This VM runs 24/7 for MT5 terminal integration

#### E. Cloud Storage ($0.50-2.00/month)

**Active Buckets**:
- `tradetaper-uploads`: 1.72 MiB (actively used)
- `trade-taper-uploads`: 0 B
- `trade-taper.appspot.com`: App Engine default
- `staging.trade-taper.appspot.com`: Staging
- `trade-taper_cloudbuild`: Build artifacts
- `run-sources-trade-taper-us-central1`: Cloud Run sources

**Estimated Costs**:
- Storage (5GB avg): 5GB × $0.020/GB = **$0.10/month**
- Operations: ~10,000 Class A/B ops = **$0.50/month**
- Egress: Minimal for CDN = **$1.00/month**
- **Total Storage**: **~$1.60/month**

#### F. Networking ($2.00-5.00/month)

- VPC egress (private-ranges-only): Minimal
- Cloud Run egress: ~10GB/month = **$1.20/month**
- VPC Connector traffic: Included
- **Estimated**: **$2-5/month**

#### G. Cloud Build ($0/month - Free Tier)

- Free: 120 build-minutes/day
- Current usage: ~10-20 builds/month (well within free tier)
- **Cost**: **$0/month**

**GCP TOTAL**: **$106.54/month** ($1,278.48/year)

---

### 2. External Services

#### A. Supabase (Database) ($0-25/month)

**Current Plan**: Free tier or Pro
- Database: PostgreSQL
- Storage: Included
- API requests: Unlimited (Free tier: 500MB, 2GB egress)

**Free Tier Limits**:
- ✅ 500MB database size
- ✅ 2GB egress/month
- ✅ 50,000 monthly active users
- ✅ 500MB file storage

**Estimated Cost**:
- If on Free tier: **$0/month**
- If on Pro tier: **$25/month** (recommended for production)

**Pro Tier Benefits ($25/month)**:
- 8GB database
- 50GB egress
- Daily backups
- 7-day log retention
- No pausing

**Current Assessment**: Likely on Free tier, recommend upgrading to Pro for production reliability.

#### B. API Services ($0/month - Free Tiers)

**Stock/Forex Data APIs** (from .env.yaml):
- **Alpha Vantage**: Free tier (500 requests/day)
- **FMP (Financial Modeling Prep)**: Free tier (250 requests/day)
- **Polygon.io**: Free tier (5 requests/minute)
- **TwelveData**: Free tier (800 requests/day)
- **News API**: Free tier (100 requests/day)
- **TraderMade**: Free tier or paid plan

**MetaAPI (MT5 Integration)**:
- Current token in use (paid service)
- **Estimated**: $0-79/month depending on plan
- Free tier: 1 account, real-time data
- Paid: $79/month for unlimited accounts

**Estimated Total API Costs**: **$0-79/month**

#### C. Razorpay (Payment Gateway) ($0 + 2% fees)

- Setup fee: $0
- Monthly fee: $0
- Transaction fee: **2% + ₹0** per transaction
- International cards: **3% + ₹0**

**Example Revenue Scenario**:
- 100 subscriptions × ₹999/month = ₹99,900
- Razorpay fees (2%): **₹1,998** (~$24 USD)

**Cost**: Variable, **$20-50/month** at scale

#### D. Google OAuth & Firebase ($0/month)

- OAuth: Free
- FCM (Push Notifications): Free tier (unlimited)
- **Cost**: **$0/month**

#### E. Resend (Email Service) ($0/month)

- Free tier: 3,000 emails/month
- Additional emails: $0.001/email
- **Current**: Likely free tier
- **Cost**: **$0/month** (free tier sufficient for MVP)

**External Services TOTAL**: **$25-154/month** (depending on MetaAPI plan)

---

### 3. Domain & DNS ($1-12/month)

- **tradetaper.com**: ~$12/year = **$1/month**
- DNS (Cloud DNS): ~$0.20/month
- **Total**: **$1.20/month**

---

## 💰 Monthly Cost Summary

### Current (Low Traffic - MVP Stage)

| Service | Monthly Cost |
|---------|--------------|
| Cloud Run Services | $69.65 |
| Redis (Memorystore) | $11.68 |
| VPC Connector (2 instances) | $14.60 |
| Compute Engine VM | $7.11 |
| Cloud Storage | $1.60 |
| Networking | $2.00 |
| **GCP Subtotal** | **$106.64** |
| | |
| Supabase (Free/Pro) | $0-25.00 |
| MetaAPI | $0-79.00 |
| Razorpay Fees | $20-50.00 |
| Other APIs | $0.00 |
| **External Subtotal** | **$20-154.00** |
| | |
| Domain & DNS | $1.20 |
| **TOTAL** | **$127.84 - $261.84** |

**Realistic Current Estimate**: **$150-180/month**

---

## 📈 Scaling Cost Projections

### Scenario 1: Growth Stage (10x Traffic)
**1,000 active users, 1M requests/month**

| Service | Current | Growth Stage | Increase |
|---------|---------|--------------|----------|
| Cloud Run | $69.65 | $250.00 | +$180.35 |
| Redis | $11.68 | $23.36 (2GB) | +$11.68 |
| VPC Connector | $14.60 | $36.50 (5 inst) | +$21.90 |
| Compute (VM) | $7.11 | $14.22 (e2-small) | +$7.11 |
| Storage | $1.60 | $15.00 | +$13.40 |
| Networking | $2.00 | $20.00 | +$18.00 |
| Supabase | $25.00 | $99.00 (Team) | +$74.00 |
| **TOTAL** | **$131.64** | **$458.08** | **+$326.44** |

**Monthly**: **$458/month** ($5,496/year)

---

### Scenario 2: Scale Stage (50x Traffic)
**5,000 active users, 5M requests/month**

| Service | Current | Scale Stage | Increase |
|---------|---------|-------------|----------|
| Cloud Run | $69.65 | $800.00 | +$730.35 |
| Redis | $11.68 | $70.08 (6GB Std) | +$58.40 |
| VPC Connector | $14.60 | $73.00 (10 inst) | +$58.40 |
| Compute | $7.11 | $50.00 (n1-std-1) | +$42.89 |
| Storage | $1.60 | $50.00 | +$48.40 |
| Networking | $2.00 | $100.00 | +$98.00 |
| Supabase | $25.00 | $599.00 (Enterprise) | +$574.00 |
| CDN | $0.00 | $50.00 | +$50.00 |
| **TOTAL** | **$131.64** | **$1,792.08** | **+$1,660.44** |

**Monthly**: **$1,792/month** ($21,504/year)

---

### Scenario 3: Enterprise Stage (100x Traffic)
**10,000+ active users, 10M+ requests/month**

| Service | Monthly Cost |
|---------|--------------|
| Cloud Run (multiple regions) | $2,000 |
| Redis (Cluster mode) | $500 |
| Load Balancer | $200 |
| Compute (autoscaling) | $300 |
| Storage + CDN | $150 |
| Networking | $300 |
| Database (dedicated) | $1,500 |
| Monitoring & Logging | $100 |
| **TOTAL** | **$5,050/month** |

**Annual**: **$60,600/year**

---

## 🎯 Cost Optimization Recommendations

### Immediate Wins (Save $20-30/month)

1. **Delete Unused Storage Buckets** ($0.50/month)
   ```bash
   # Keep only tradetaper-uploads and run-sources
   gsutil rm -r gs://trade-taper-uploads
   gsutil rm -r gs://staging.trade-taper.appspot.com
   ```

2. **Enable Preemptible VM for Terminal** (Save $4/month = 50%)
   - Current: e2-micro standard = $6.12/month
   - Preemptible: e2-micro preemptible = $3.06/month
   - **Savings**: **$3.06/month** ($36.72/year)
   - Note: VM may restart every 24h (acceptable for dev/testing)

3. **Reduce VPC Connector Min Instances** (Save $7.30/month)
   - Current: 2 min instances = $14.60/month
   - Optimized: 1 min instance = $7.30/month (sufficient for low traffic)
   - **Savings**: **$7.30/month** ($87.60/year)
   - Risk: Slight cold start delay during traffic spikes

4. **Cloud Run Scaling Optimization** (Save $10-20/month)
   ```yaml
   # Add to Cloud Run config
   minInstances: 0  # Allow scale to zero
   maxInstances: 10
   concurrency: 80  # Maximize instance utilization
   ```
   - **Savings**: **$10-20/month** during low traffic periods

5. **Consolidate API Calls** (Reduce free tier risk)
   - Cache forex/stock data for 5-15 minutes
   - Batch requests where possible
   - **Savings**: Avoid paid tier triggers

**Total Immediate Savings**: **$20-30/month** ($240-360/year)

---

### Medium-Term Optimizations (Save $50-100/month at scale)

6. **Use Cloud CDN for Static Assets** (Reduce egress)
   - Enable Cloud CDN on Cloud Storage bucket
   - Cache static files (images, CSS, JS)
   - **Savings**: 50-70% reduction in egress costs at scale

7. **Implement Aggressive Caching** (Reduce DB queries)
   - Redis cache for frequently accessed data
   - Cache user sessions (reduce DB load by 30-40%)
   - **Savings**: Delay Supabase tier upgrades

8. **Batch Processing for Non-Critical Tasks**
   - Queue non-urgent notifications
   - Batch email sends
   - **Savings**: Reduce API calls by 20-30%

9. **Regional Optimization**
   - Move all services to same region (us-central1) ✅ Already done
   - Minimize cross-region traffic
   - **Savings**: $5-10/month in networking

10. **Database Query Optimization** ✅ Already done
    - Indexes implemented (MT5 integration)
    - N+1 queries eliminated
    - **Savings**: 10x faster queries = less compute time

---

### Long-Term Architecture Changes (Save $200-500/month at enterprise scale)

11. **Self-Hosted Database** (If enterprise scale)
    - Replace Supabase with Cloud SQL or GKE PostgreSQL
    - **Cost**: $150-300/month (vs $599 Supabase Enterprise)
    - **Savings**: $300-400/month at enterprise scale
    - **Complexity**: High (requires DBA expertise)

12. **Kubernetes (GKE)** (If multi-service architecture)
    - Replace Cloud Run with GKE Autopilot
    - Better for microservices at scale
    - **Savings**: 20-30% at enterprise scale
    - **Complexity**: High

13. **Reserved Capacity / Committed Use Discounts**
    - Commit to 1-year or 3-year Cloud Run usage
    - **Savings**: 25-50% discount on compute
    - **Requirement**: Predictable traffic

---

## 💡 Free Tier & Credit Opportunities

### Current Free Tier Usage

| Service | Free Tier | Current Usage | Status |
|---------|-----------|---------------|--------|
| Cloud Build | 120 min/day | ~10-20 builds/month | ✅ Free |
| Supabase | 500MB DB, 2GB egress | Unknown | ⚠️ Monitor |
| Firebase FCM | Unlimited | Low | ✅ Free |
| Alpha Vantage | 500 req/day | Low | ✅ Free |
| FMP API | 250 req/day | Low | ✅ Free |
| Resend Email | 3,000/month | Low | ✅ Free |

### GCP Credits & Programs

1. **Google Cloud Startup Program**
   - Up to $100,000 in credits over 2 years
   - Technical support included
   - Apply at: cloud.google.com/startup

2. **Always Free Tier** (Not currently utilized)
   - Cloud Functions: 2M invocations/month
   - Cloud Storage: 5GB
   - Cloud Firestore: 1GB storage
   - Consider migrating some features to maximize free tier

---

## 📊 Revenue vs Cost Analysis

### Break-Even Analysis

**Monthly Costs**: $150-180 (current)

**Subscription Plans** (from Razorpay config):
- Essential Monthly: ₹999 (~$12 USD)
- Premium Monthly: ₹1,999 (~$24 USD)
- Essential Yearly: ₹9,999 (~$120 USD)
- Premium Yearly: ₹19,999 (~$240 USD)

**Break-Even Subscribers** (excluding Razorpay fees):
- At $150/month cost: Need **13 Essential** or **7 Premium** monthly subscribers
- At $180/month cost: Need **15 Essential** or **8 Premium** monthly subscribers

**Profitability Example** (100 users):
```
Revenue:
  50 Essential Monthly × $12 = $600
  50 Premium Monthly × $24 = $1,200
  Total Revenue: $1,800/month

Costs:
  GCP: $150
  External: $50
  Razorpay (2%): $36
  Total Costs: $236/month

NET PROFIT: $1,564/month ($18,768/year)
Profit Margin: 87%
```

**Excellent unit economics** - software margins are very healthy!

---

## 🚨 Cost Alerts & Monitoring

### Recommended Budget Alerts

Set up GCP billing alerts at these thresholds:

1. **Monthly Budget**: $200
   - Alert at 50% ($100)
   - Alert at 80% ($160)
   - Alert at 100% ($200)
   - Alert at 150% ($300)

2. **Daily Budget**: $10/day
   - Alert if exceeded

3. **Service-Specific Alerts**:
   - Cloud Run > $100/month
   - Redis > $20/month
   - Storage egress > $10/month
   - VPC Connector > $30/month

### Setup Budget Alerts

```bash
# Create budget alert
gcloud billing budgets create \
  --billing-account=YOUR_BILLING_ACCOUNT \
  --display-name="TradeTaper Monthly Budget" \
  --budget-amount=200 \
  --threshold-rule=percent=50 \
  --threshold-rule=percent=80 \
  --threshold-rule=percent=100
```

### Monitoring Dashboard

**Key Metrics to Track**:
- Cloud Run instance hours (should be <730/month per service)
- Redis memory usage (upgrade if >80% consistently)
- Storage egress (optimize if >50GB/month)
- VPC Connector active instances (should be 2-3 avg)
- API call counts (stay within free tiers)

---

## 📅 Annual Budget Forecast

### Year 1 Projection (MVP to Growth)

| Quarter | Users | Monthly Cost | Quarterly Cost |
|---------|-------|--------------|----------------|
| Q1 (MVP) | 50 | $150 | $450 |
| Q2 (Launch) | 200 | $200 | $600 |
| Q3 (Growth) | 500 | $300 | $900 |
| Q4 (Scale) | 1,000 | $450 | $1,350 |
| **TOTAL** | | | **$3,300/year** |

**Average**: **$275/month** in Year 1

### Year 2 Projection (Growth to Scale)

| Quarter | Users | Monthly Cost | Quarterly Cost |
|---------|-------|--------------|----------------|
| Q1 | 2,000 | $600 | $1,800 |
| Q2 | 3,500 | $900 | $2,700 |
| Q3 | 5,000 | $1,200 | $3,600 |
| Q4 | 7,500 | $1,500 | $4,500 |
| **TOTAL** | | | **$12,600/year** |

**Average**: **$1,050/month** in Year 2

---

## ✅ Action Items

### Immediate (This Week)

- [ ] Set up GCP billing alerts ($200/month budget)
- [ ] Enable detailed cost breakdown in GCP console
- [ ] Document current Supabase tier (Free vs Pro)
- [ ] Verify MetaAPI subscription cost
- [ ] Delete unused storage buckets (save $0.50/month)

### Short-Term (This Month)

- [ ] Implement Cloud Run autoscaling (minInstances: 0)
- [ ] Reduce VPC Connector min instances to 1 (save $7.30/month)
- [ ] Consider preemptible VM for terminal (save $3/month)
- [ ] Set up cost monitoring dashboard
- [ ] Review API usage against free tier limits

### Medium-Term (Next 3 Months)

- [ ] Implement aggressive Redis caching
- [ ] Enable Cloud CDN for static assets
- [ ] Optimize database queries (reduce Supabase usage)
- [ ] Apply for Google Cloud Startup credits ($100k potential)
- [ ] Plan for Supabase Pro upgrade when needed ($25/month)

### Long-Term (6-12 Months)

- [ ] Evaluate Committed Use Discounts when traffic is predictable
- [ ] Consider Cloud SQL migration if enterprise scale
- [ ] Implement cost allocation tags by feature
- [ ] Plan multi-region deployment strategy
- [ ] Evaluate GKE for microservices architecture

---

## 📊 Cost Comparison: Current vs Optimized

| Item | Current | Optimized | Savings |
|------|---------|-----------|---------|
| VPC Connector | $14.60 (2 min) | $7.30 (1 min) | $7.30 |
| Compute VM | $7.11 (std) | $3.06 (preempt) | $4.05 |
| Cloud Run | $69.65 (always-on) | $50.00 (scale-to-zero) | $19.65 |
| Storage | $1.60 (6 buckets) | $0.80 (2 buckets) | $0.80 |
| **TOTAL** | **$92.96** | **$61.16** | **$31.80/month** |

**Annual Savings**: **$381.60/year** (34% reduction in GCP costs)

---

## 🎓 Key Takeaways

### ✅ Current State
- Monthly cost: **$150-180** (very reasonable for MVP)
- Architecture: Well-optimized for scale
- Free tier usage: Good (APIs, Cloud Build)
- Break-even: Only **13-15 paying users** needed

### 💰 Cost Efficiency
- **87% profit margins** on subscriptions
- Low per-user cost (~$1.50-3.00/user at 100 users)
- Excellent scaling economics (costs grow sub-linearly)

### 🚀 Growth Runway
- Current architecture can handle **10x growth** with minimal cost increase
- **50x growth** requires only 14x cost increase
- No major architectural changes needed until 5,000+ users

### ⚠️ Risk Areas
1. **MetaAPI costs** - Verify subscription (could be $79/month)
2. **Supabase free tier limits** - Monitor DB size and egress
3. **API free tier overages** - Track daily request counts
4. **Razorpay transaction fees** - 2% of all revenue

### 💡 Optimization Potential
- **Immediate savings**: $20-30/month (10-15% reduction)
- **Medium-term savings**: $50-100/month at growth stage
- **Long-term savings**: $200-500/month at enterprise scale

---

## 📚 Resources

- [GCP Pricing Calculator](https://cloud.google.com/products/calculator)
- [Cloud Run Pricing](https://cloud.google.com/run/pricing)
- [Memorystore Redis Pricing](https://cloud.google.com/memorystore/pricing)
- [Supabase Pricing](https://supabase.com/pricing)
- [GCP Cost Optimization Best Practices](https://cloud.google.com/cost-management/docs/best-practices)

---

**Last Updated**: February 9, 2026
**Next Review**: March 9, 2026 (monthly)
**Budget Owner**: Project Administrator
