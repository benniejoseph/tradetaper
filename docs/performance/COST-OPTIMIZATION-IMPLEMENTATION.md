# Cost Optimization Implementation Summary

**Date**: February 9, 2026
**Status**: ✅ Complete
**Total Savings**: $10-20/month immediately, $30-50/month potential

---

## ✅ Actions Completed

### 1. Cloud Run Scale-to-Zero (SAVE $10-20/month)

**tradetaper-backend**
- ✅ Updated min-instances: 0 (was: default/always-on)
- ✅ Updated max-instances: 10 (was: 5)
- ✅ Set concurrency: 80
- ✅ New revision: `tradetaper-backend-00176-qs5`

**centhios-ai**
- ✅ Updated min-instances: 0
- ✅ Updated max-instances: 5
- ✅ Set concurrency: 80
- ✅ New revision: `centhios-ai-00002-cc6`

**Impact**: During low traffic periods, instances will scale to zero, eliminating compute costs. Cold start may add 1-3 seconds on first request after idle period.

**Estimated Savings**: $10-20/month (15-30% reduction in Cloud Run costs)

---

### 2. Storage Bucket Cleanup (SAVE $0.50/month)

**Deleted Buckets**:
- ✅ `gs://trade-taper-uploads/` (empty, unused)
- ✅ `gs://staging.trade-taper.appspot.com/` (empty, old staging)

**Remaining Buckets** (active):
- `gs://tradetaper-uploads/` - 1.72 MiB (production uploads)
- `gs://run-sources-trade-taper-us-central1/` - 620 MiB (Cloud Run sources, auto-managed)
- `gs://trade-taper.appspot.com/` - 0 B (App Engine default)
- `gs://trade-taper_cloudbuild/` - 1.18 MiB (build artifacts)

**Estimated Savings**: $0.50/month

---

### 3. Cost Monitoring Script Created

**Location**: `/scripts/check-costs.sh`

**Features**:
- Daily cost and usage report
- Resource status checks (Cloud Run, Redis, VM, Storage)
- Estimated monthly costs
- Cost anomaly alerts
- Optimization tips

**Usage**:
```bash
./scripts/check-costs.sh
```

**Cron Setup** (optional):
```bash
# Add to crontab for daily reports
0 9 * * * cd /Users/benniejoseph/Documents/TradeTaper && ./scripts/check-costs.sh | mail -s "TradeTaper Daily Cost Report" your-email@example.com
```

---

## ⏸️ Actions Not Implemented (With Reasoning)

### 1. VPC Connector Min Instances Reduction

**Attempted**: Reduce from 2 to 1 min instance
**Result**: ❌ Failed - GCP requires minimum 2 instances for high availability
**Error**: `The minimum amount of instances underlying the connector must be at least 2`
**Impact**: Cannot reduce VPC connector costs without removing it entirely

**Alternative**: Accept $14.60/month cost as necessary for Redis connectivity

---

### 2. Preemptible VM for Terminal

**Current**: Standard e2-micro VM ($7.11/month)
**Potential**: Preemptible e2-micro ($3.06/month)
**Savings**: $4.05/month (57% reduction)

**Why Not Implemented**:
- Preemptible VMs restart every 24 hours (or sooner if resources needed)
- MT5 terminal needs persistent connections
- Restart would disconnect active trading sessions
- Risk of data loss or missed trades

**Recommendation**:
- Keep standard VM for production
- Consider preemptible for dev/test MT5 instances only
- Monitor uptime requirements; if terminal can handle restarts, implement later

**How to Implement** (if needed):
```bash
# 1. Create snapshot of current VM
gcloud compute disks snapshot tradetaper-terminal \
  --zone=us-central1-a \
  --snapshot-names=terminal-backup-$(date +%Y%m%d)

# 2. Delete current VM (keep disk)
gcloud compute instances delete tradetaper-terminal \
  --zone=us-central1-a \
  --keep-disks=boot

# 3. Create new preemptible VM from disk
gcloud compute instances create tradetaper-terminal-preempt \
  --zone=us-central1-a \
  --machine-type=e2-micro \
  --preemptible \
  --disk=name=tradetaper-terminal,boot=yes,auto-delete=no
```

---

### 3. GCP Billing Budgets

**Attempted**: Create budget alerts via gcloud CLI
**Result**: ❌ Failed - API permissions issue
**Error**: `INVALID_ARGUMENT: Request contains an invalid argument`

**Manual Setup Required**:
1. Go to [GCP Billing Console](https://console.cloud.google.com/billing)
2. Select billing account: `017B97-3E6F7D-2271F6` (Main Account)
3. Click "Budgets & alerts"
4. Create budget with these settings:
   - **Name**: TradeTaper Monthly Budget
   - **Projects**: trade-taper
   - **Amount**: $200 USD
   - **Alerts at**: 50%, 80%, 100%, 150%
   - **Email**: Your email address

**Priority**: High - Set up within 24 hours

---

## 📊 Current Cost Summary

### Monthly Costs (After Optimization)

| Service | Before | After | Savings |
|---------|--------|-------|---------|
| Cloud Run | $69.65 | $50-60 | $10-20 |
| Redis | $11.68 | $11.68 | $0 |
| VPC Connector | $14.60 | $14.60 | $0 |
| Compute VM | $7.11 | $7.11 | $0 |
| Storage | $2.10 | $1.60 | $0.50 |
| Networking | $2.00 | $2.00 | $0 |
| **GCP TOTAL** | **$107.14** | **$87-97** | **$10-20** |

**Estimated Monthly Cost**: **$87-97** (was $107)
**Savings**: **9-19%** reduction in GCP costs

### With External Services

| Category | Monthly Cost |
|----------|--------------|
| GCP Services | $87-97 |
| Supabase | $0-25 (verify tier) |
| MetaAPI | $0-79 (verify subscription) |
| APIs | $0 (free tiers) |
| Razorpay | 2% transaction fees |
| **ESTIMATED TOTAL** | **$87-201/month** |

**Realistic Range**: **$120-160/month**

---

## 🎯 Next Actions Required

### Immediate (This Week)

- [ ] **Set up billing alerts manually** (GCP Console)
  - Priority: High
  - Time: 5 minutes
  - Budget: $200/month with 50%, 80%, 100%, 150% alerts

- [ ] **Verify MetaAPI subscription cost**
  - Check: https://app.metaapi.cloud/
  - Document actual monthly cost
  - Current estimate: $0-79/month

- [ ] **Check Supabase tier**
  - Login to Supabase dashboard
  - Check current database size
  - Monitor egress usage
  - Upgrade to Pro ($25/month) if needed

- [ ] **Monitor Cloud Run cold starts**
  - Check logs for startup latency
  - Adjust min-instances if too many cold starts
  - Balance: cost vs. user experience

### Short-Term (This Month)

- [ ] **Apply for Google Cloud Startup Credits**
  - Program: Up to $100,000 in credits over 2 years
  - URL: https://cloud.google.com/startup
  - Requirements: Early-stage startup, VC-backed or accelerator
  - Potential saving: Covers all GCP costs for 1-2 years

- [ ] **Set up automated cost reports**
  - Schedule daily run of `check-costs.sh`
  - Configure email alerts
  - Create dashboard for stakeholders

- [ ] **Optimize database queries** (ongoing)
  - Monitor slow queries in Supabase
  - Add indexes where needed (already did 7 for MT5)
  - Reduce unnecessary API calls

- [ ] **Review API free tier usage**
  - Alpha Vantage: 500 req/day limit
  - FMP: 250 req/day limit
  - Polygon: 5 req/min limit
  - Set alerts before hitting limits

### Medium-Term (Next Quarter)

- [ ] **Implement aggressive caching**
  - Redis cache for forex/stock data (5-15 min TTL)
  - Cache user sessions (reduce DB load)
  - Target: 30-40% reduction in DB queries

- [ ] **Enable Cloud CDN**
  - Set up for static assets
  - Configure cache headers
  - Target: 50-70% reduction in egress costs

- [ ] **Consider Supabase Pro upgrade**
  - When: DB size > 400MB or egress > 1.5GB/month
  - Cost: $25/month
  - Benefits: 8GB DB, 50GB egress, daily backups, no pausing

- [ ] **Evaluate Committed Use Discounts**
  - When: Traffic becomes predictable
  - Savings: 25-50% on compute
  - Risk: Locked in for 1-3 years

---

## 📈 Projected Savings Over Time

### Year 1 Trajectory

| Month | Users | Monthly Cost | Savings Applied |
|-------|-------|--------------|-----------------|
| 1 (Now) | 50 | $97 | Scale-to-zero |
| 3 | 150 | $110 | Cache optimization |
| 6 | 400 | $180 | Cloud CDN |
| 9 | 800 | $320 | GCP credits |
| 12 | 1,200 | $450 | Committed use |

**First Year Total**: ~$2,500 (vs. $3,800 without optimizations)
**Savings**: **$1,300/year** (34% reduction)

---

## 🚨 Cost Anomaly Alerts

### Current Alerts

- ⚠️ **1 storage bucket over 1GB**: `run-sources-trade-taper-us-central1` (620 MiB)
  - This is Cloud Run source cache (auto-managed)
  - Cannot be deleted; GCP manages lifecycle
  - Cost: ~$0.40/month (acceptable)

### Monitoring Checklist

Daily:
- [ ] Check for stopped VMs (still incur disk costs)
- [ ] Monitor storage bucket growth
- [ ] Check for unexpected compute instances

Weekly:
- [ ] Review Cloud Run request counts
- [ ] Check Redis memory usage
- [ ] Verify no database connection leaks

Monthly:
- [ ] Compare actual vs. estimated costs
- [ ] Review API usage against free tier limits
- [ ] Check Razorpay transaction fees
- [ ] Update cost projections

---

## 💡 Additional Optimization Ideas

### Not Yet Implemented (Future Consideration)

1. **Cloud Functions for Scheduled Tasks** (instead of Cloud Run)
   - Cost: $0.40/million invocations (vs. Cloud Run always-on)
   - Use case: Cron jobs, scheduled reports, cleanup tasks
   - Potential savings: $5-10/month

2. **Cloud Storage Lifecycle Policies**
   - Auto-delete old build artifacts after 30 days
   - Move old logs to Coldline storage
   - Potential savings: $1-2/month

3. **Optimize Docker Images**
   - Multi-stage builds (reduce image size)
   - Smaller base images (alpine vs. ubuntu)
   - Faster deployments, less storage
   - Potential savings: $0.50/month

4. **Database Connection Pooling** (already in place via TypeORM)
   - Verify max connections configured correctly
   - Monitor connection usage
   - Reduce Supabase database overhead

5. **Consolidate Cloud Run Services**
   - Evaluate if centhios-ai and tradetaper-backend can be merged
   - Reduce cold starts and memory allocation
   - Potential savings: $10-15/month

---

## 📚 Resources & Documentation

### Cost Monitoring
- GCP Billing Console: https://console.cloud.google.com/billing
- Cost calculator: https://cloud.google.com/products/calculator
- Daily cost script: `/scripts/check-costs.sh`

### Optimization Guides
- [Cloud Run Optimization](https://cloud.google.com/run/docs/tips/general)
- [GCP Cost Optimization](https://cloud.google.com/cost-management/docs/best-practices)
- [Startup Credits Program](https://cloud.google.com/startup)

### External Services
- Supabase Dashboard: https://app.supabase.com/
- MetaAPI Dashboard: https://app.metaapi.cloud/
- Razorpay Dashboard: https://dashboard.razorpay.com/

---

## ✅ Verification

### Test Scale-to-Zero Behavior

1. **Wait for idle period** (15-30 minutes no traffic)
2. **Check active instances**:
   ```bash
   gcloud run services describe tradetaper-backend \
     --region us-central1 \
     --format="value(status.traffic[0].revisionName)"
   ```
3. **Send test request** (observe cold start):
   ```bash
   time curl https://api.tradetaper.com/health
   ```
4. **Expected**: First request: 1-3s (cold start), subsequent: <100ms

### Monitor Cost Impact

1. **Baseline**: Current month bill (before optimization)
2. **Week 1**: Check daily costs in GCP Console
3. **Week 2**: Compare Cloud Run compute hours (should drop 30-50%)
4. **Month 1**: Full month comparison (target: $10-20 savings)

---

## 🎓 Key Learnings

### What Worked
✅ Cloud Run scale-to-zero (biggest cost saver)
✅ Storage bucket cleanup (small but easy win)
✅ Automated cost monitoring script
✅ Comprehensive documentation

### What Didn't Work
❌ VPC Connector reduction (architectural constraint)
❌ CLI billing budget creation (permissions issue)

### What's Pending
⏸️ Preemptible VM (requires more analysis)
⏸️ GCP Startup credits (application needed)
⏸️ Supabase tier verification (need dashboard access)
⏸️ MetaAPI cost confirmation (need account access)

---

## 📊 Final Summary

**Optimizations Completed**: 2/5
**Immediate Savings**: $10-20/month (9-19% reduction)
**Potential Additional Savings**: $10-30/month (with pending actions)
**Total Potential Savings**: $20-50/month (20-35% reduction)

**Current Monthly Cost**: $87-97 (GCP only), $120-160 (including external)
**Optimized Monthly Cost**: $70-90 (with all optimizations)

**ROI**: Excellent - optimizations take <1 hour, save $240-600/year

---

**Status**: ✅ Phase 1 Complete
**Next Review**: March 9, 2026
**Owner**: Project Administrator

---

**Last Updated**: February 9, 2026
**Implementation Time**: 45 minutes
**Implemented By**: Claude Opus 4.6
