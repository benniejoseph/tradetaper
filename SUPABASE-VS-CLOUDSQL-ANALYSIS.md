# Supabase vs Cloud SQL: Long-Term Cost Analysis

**Date**: February 9, 2026
**Purpose**: Determine which database solution is cheaper long-term for TradeTaper

---

## 📊 Executive Summary

**TL;DR**:
- **Small Scale (0-1,000 users)**: Supabase is **40-60% cheaper**
- **Medium Scale (1,000-10,000 users)**: Supabase is **30-50% cheaper**
- **Large Scale (10,000+ users)**: Cloud SQL becomes **10-30% cheaper**
- **Recommended**: **Supabase** for your current stage and next 2-3 years

---

## 💰 Cost Comparison by Scale

### Scenario 1: Current Stage (50-500 users)

#### Supabase
```
Tier: Pro (recommended for production)
Database: 8 GB
Bandwidth: 50 GB egress/month
Connections: 200 concurrent
Backups: Daily + PITR (7 days)
Support: Email

Monthly Cost: $25
Annual Cost: $300
```

#### Cloud SQL (Equivalent)
```
Instance: db-g1-small (1 vCPU, 1.7 GB RAM)
Storage: 10 GB SSD
Backups: Automated daily
High availability: No

Cost Breakdown:
- Instance: $0.0445/hour × 730 hours = $32.49
- Storage: 10 GB × $0.17/GB = $1.70
- Backups (10 GB): $0.08/GB × 10 = $0.80
- Network egress: 50 GB × $0.12/GB = $6.00
────────────────────────────────────────────
Monthly Cost: $40.99
Annual Cost: $491.88
```

**Winner**: Supabase (39% cheaper) ✅

---

### Scenario 2: Growth Stage (1,000-5,000 users)

#### Supabase
```
Tier: Pro (still sufficient)
Database: 8 GB (usage: ~3-5 GB)
Bandwidth: 50 GB egress/month (usage: ~30 GB)
Connections: 200 concurrent (usage: ~50-100)

Monthly Cost: $25
Annual Cost: $300

Overage costs (if needed):
- Extra storage: $0.125/GB
- Extra bandwidth: $0.09/GB
- Extra 1,000 MAU: $2.50

Estimated with buffer: $30-40/month
```

#### Cloud SQL (Appropriate tier)
```
Instance: db-n1-standard-1 (1 vCPU, 3.75 GB RAM)
Storage: 50 GB SSD
Backups: Automated daily (50 GB)
High availability: No

Cost Breakdown:
- Instance: $0.0825/hour × 730 hours = $60.23
- Storage: 50 GB × $0.17/GB = $8.50
- Backups: 50 GB × $0.08/GB = $4.00
- Network egress: 50 GB × $0.12/GB = $6.00
────────────────────────────────────────────
Monthly Cost: $78.73
Annual Cost: $944.76

With connection pooling (Cloud SQL Proxy): +$0
With read replicas (recommended): +$60/month
```

**Winner**: Supabase (50-62% cheaper) ✅

---

### Scenario 3: Scale Stage (5,000-10,000 users)

#### Supabase
```
Tier: Team
Database: 100 GB
Bandwidth: 250 GB egress/month
Connections: 500 concurrent
Backups: Daily + PITR (14 days)
Support: Priority email
Social OAuth providers: Unlimited

Monthly Cost: $599
Annual Cost: $7,188

OR stay on Pro with overages:
Base: $25
Storage overage: 50 GB × $0.125 = $6.25
Bandwidth overage: 100 GB × $0.09 = $9.00
────────────────────────────────────────────
Estimated: $40-50/month (if optimized)
```

#### Cloud SQL (Appropriate tier)
```
Instance: db-n1-standard-2 (2 vCPU, 7.5 GB RAM)
Storage: 100 GB SSD
Backups: Automated daily (100 GB)
High availability: Yes (recommended at scale)

Cost Breakdown:
- Instance: $0.1650/hour × 730 hours = $120.45
- HA replica: $0.1650/hour × 730 hours = $120.45
- Storage: 100 GB × $0.17/GB = $17.00
- HA replica storage: 100 GB × $0.17/GB = $17.00
- Backups: 100 GB × $0.08/GB = $8.00
- Network egress: 250 GB × $0.12/GB = $30.00
────────────────────────────────────────────
Monthly Cost: $312.90
Annual Cost: $3,754.80

Without HA (not recommended):
Monthly Cost: $175.45
```

**Winner**: Supabase Pro with overages ($40-50) - 84% cheaper ✅
**If using Supabase Team**: Cloud SQL without HA - 71% cheaper ❌

---

### Scenario 4: Enterprise Stage (10,000-50,000 users)

#### Supabase
```
Tier: Enterprise (Custom pricing)
Database: 500 GB+
Bandwidth: 1 TB+ egress/month
Connections: 1,000+ concurrent
Backups: Custom retention
Support: Dedicated + SLA
Priority features & requests

Estimated Monthly Cost: $2,000-5,000
Annual Cost: $24,000-60,000

(Based on public enterprise pricing estimates)
```

#### Cloud SQL (Production scale)
```
Instance: db-n1-highmem-4 (4 vCPU, 26 GB RAM)
Storage: 500 GB SSD
Backups: Automated daily (500 GB)
High availability: Yes (required)
Read replicas: 2 (for load distribution)

Cost Breakdown:
- Primary instance: $0.4090/hour × 730 = $298.57
- HA replica: $0.4090/hour × 730 = $298.57
- Read replica 1: $0.4090/hour × 730 = $298.57
- Read replica 2: $0.4090/hour × 730 = $298.57
- Storage (4 × 500 GB): 2,000 GB × $0.17 = $340.00
- Backups: 500 GB × $0.08 = $40.00
- Network egress: 1 TB × $0.12 = $122.88
- Cloud SQL Proxy: $0 (included)
────────────────────────────────────────────
Monthly Cost: $1,697.16
Annual Cost: $20,365.92

With optimizations (2 replicas instead of 3):
Monthly Cost: $1,398.59
```

**Winner**: Cloud SQL - 30-72% cheaper ✅

---

## 📈 Cost Trajectory Over Time

### Year 1: MVP → Growth (0-1,000 users)

| Month | Users | Supabase | Cloud SQL | Winner |
|-------|-------|----------|-----------|--------|
| 1-3 | 50 | $25 | $41 | Supabase (-39%) |
| 4-6 | 200 | $25 | $41 | Supabase (-39%) |
| 7-9 | 500 | $25 | $41 | Supabase (-39%) |
| 10-12 | 1,000 | $30 | $60 | Supabase (-50%) |

**Year 1 Total**: Supabase $330 vs Cloud SQL $540 = **Save $210**

---

### Year 2: Growth → Scale (1,000-5,000 users)

| Month | Users | Supabase | Cloud SQL | Winner |
|-------|-------|----------|-----------|--------|
| 1-3 | 1,500 | $35 | $79 | Supabase (-56%) |
| 4-6 | 2,500 | $40 | $79 | Supabase (-49%) |
| 7-9 | 3,500 | $45 | $120 | Supabase (-63%) |
| 10-12 | 5,000 | $50 | $175 | Supabase (-71%) |

**Year 2 Total**: Supabase $510 vs Cloud SQL $1,356 = **Save $846**

---

### Year 3: Scale (5,000-10,000 users)

| Month | Users | Supabase | Cloud SQL | Winner |
|-------|-------|----------|-----------|--------|
| 1-6 | 7,000 | $599 (Team) | $313 (with HA) | Cloud SQL (-48%) |
| 7-12 | 10,000 | $599 (Team) | $313 (with HA) | Cloud SQL (-48%) |

OR stay on Pro with overages: $50-60/month
**Year 3 Total**: Supabase $600-720 vs Cloud SQL $3,756 = **Save $3,036** ✅

---

### 3-Year Total Cost

#### Option A: Supabase Pro + Overages (Recommended)
```
Year 1: $330
Year 2: $510
Year 3: $720
────────────────
Total: $1,560
```

#### Option B: Cloud SQL (Conservative scaling)
```
Year 1: $540
Year 2: $1,356
Year 3: $3,756
────────────────
Total: $5,652
```

#### Option C: Supabase Team (If heavy usage)
```
Year 1: $330
Year 2: $510
Year 3: $7,188
────────────────
Total: $8,028
```

**Best 3-Year Cost**: Supabase Pro with overages = **$1,560** (72% cheaper than Cloud SQL)

---

## 🎯 Hidden Costs & Considerations

### Supabase Hidden Benefits (Included in price)

✅ **Free features**:
- Authentication (saves $50-200/month vs Auth0)
- Storage (saves $10-50/month vs Cloud Storage)
- Realtime subscriptions (saves $100-500/month vs custom WebSocket)
- Edge Functions (saves $10-50/month vs Cloud Functions)
- Auto-generated APIs (saves development time)
- Dashboard & monitoring (included)
- SSL certificates (included)

**Estimated value**: $200-800/month in bundled features

### Cloud SQL Hidden Costs (Not included)

❌ **Additional costs**:
- Connection pooling: Cloud SQL Proxy (free) or PgBouncer ($10-20/month on separate VM)
- Monitoring: Cloud Monitoring ($5-20/month for alerts)
- Management overhead: DBA time ($0-500/month depending on complexity)
- Migration tools: Database Migration Service ($10-50/month)
- Backup storage: Incremental backups in Cloud Storage ($2-10/month)
- Network egress: $0.12/GB (can add up quickly)
- SSL certificates: Cloud Load Balancer ($18/month if needed)

**Estimated additional**: $50-200/month

### Supabase Limitations

⚠️ **Scaling constraints**:
- Connection limits (200 on Pro, 500 on Team)
- Shared infrastructure on Pro tier
- Limited control over PostgreSQL configuration
- Must upgrade to Team/Enterprise for heavy usage
- Extension support limited to approved list

### Cloud SQL Advantages at Scale

✅ **Enterprise benefits**:
- Full PostgreSQL control (all extensions, configs)
- Dedicated resources (no noisy neighbors)
- Flexible scaling (any machine type)
- Custom network topology
- Integration with GCP ecosystem
- SLA up to 99.99% (with HA)

---

## 🔄 Migration Complexity

### Supabase → Cloud SQL

**Difficulty**: Medium
**Time**: 4-8 hours
**Downtime**: 15-30 minutes

**Steps**:
1. Dump Supabase database (pg_dump)
2. Create Cloud SQL instance
3. Import data (pg_restore)
4. Update connection strings
5. Test thoroughly

**Cost**: One-time migration effort

### Cloud SQL → Supabase

**Difficulty**: Easy
**Time**: 2-4 hours
**Downtime**: 15-30 minutes

**Steps**:
1. Dump Cloud SQL database
2. Create Supabase project
3. Import data via Supabase dashboard
4. Update connection strings
5. Configure Auth/Storage if using

**Cost**: One-time migration effort

**Winner**: Bidirectional migration is feasible, not locked in ✅

---

## 💡 Recommendations by Stage

### Stage 1: MVP → Product-Market Fit (0-500 users)
**Recommended**: **Supabase Pro ($25/month)**

**Reasons**:
- 39% cheaper than Cloud SQL
- Bundled auth, storage, realtime
- Fast setup (hours vs days)
- Built-in dashboard
- No DevOps overhead

**When to reconsider**: Never for this stage

---

### Stage 2: Growth (500-5,000 users)
**Recommended**: **Supabase Pro ($25-50/month with overages)**

**Reasons**:
- 50-71% cheaper than Cloud SQL
- Still within Pro tier limits
- Can optimize to stay under $50/month
- Auth/Storage still valuable
- Low maintenance

**When to reconsider**:
- Database > 6 GB consistently
- Connections > 180 concurrent
- Need custom PostgreSQL extensions

---

### Stage 3: Scale (5,000-10,000 users)
**Recommended**: **Evaluate both options**

**Supabase Pro with heavy overages**: $50-100/month
- Still cheaper than Cloud SQL
- But approaching limits

**Supabase Team**: $599/month
- Expensive, but includes premium support
- Good if using realtime/auth heavily

**Cloud SQL (db-n1-standard-1 with HA)**: $313/month
- Cheaper than Supabase Team
- More control and scalability
- But requires DevOps expertise

**Decision point**:
- If using Supabase features heavily: Stay on Supabase
- If just using database: Consider Cloud SQL

---

### Stage 4: Enterprise (10,000+ users)
**Recommended**: **Cloud SQL or Supabase Enterprise**

**Cloud SQL**: $1,400-2,000/month
- Full control
- Predictable costs
- Mature ecosystem
- Can optimize heavily

**Supabase Enterprise**: $2,000-5,000/month (estimated)
- Managed service
- Premium support
- All features included
- Less DevOps overhead

**Decision point**:
- If have strong DevOps team: Cloud SQL (cheaper)
- If want managed service: Supabase Enterprise (convenience)

---

## 📊 Break-Even Analysis

### When Does Cloud SQL Become Cheaper?

**Connection-limited scenario**:
- Supabase Pro: 200 connections max
- If need > 200 connections, must upgrade to Team ($599)
- Cloud SQL: Can handle 4,000+ connections (db-n1-standard-2)
- **Break-even**: When you need 200+ concurrent connections

**Storage-limited scenario**:
- Supabase Pro: 8 GB included, $0.125/GB overage
- At 100 GB: $25 + ($0.125 × 92) = $36.50/month
- Cloud SQL 100 GB: $175/month (without HA)
- **Never breaks even** on storage alone

**Bandwidth-limited scenario**:
- Supabase Pro: 50 GB egress included, $0.09/GB overage
- At 500 GB egress: $25 + ($0.09 × 450) = $65.50/month
- Cloud SQL 500 GB egress: $60/month (egress only)
- **Break-even**: ~500 GB/month egress (rare for databases)

**Compute-limited scenario**:
- Supabase Team: $599/month (fixed)
- Cloud SQL with HA: $313/month (db-n1-standard-2)
- **Break-even**: When forced to upgrade to Team tier

---

## 🎯 Specific Recommendation for TradeTaper

### Current Situation
- Users: 50-100 (estimated)
- Database size: < 1 GB (likely)
- Connections: < 50 concurrent
- Egress: < 10 GB/month

### 3-Year Projection
- Year 1: 500 users
- Year 2: 2,000 users
- Year 3: 5,000 users

### Recommendation: **Supabase Pro**

**Total Cost Over 3 Years**: $1,560
**Alternative (Cloud SQL)**: $5,652
**Savings**: $4,092 (72%)

### When to Migrate to Cloud SQL

**Trigger 1**: Hitting connection limits (180+ concurrent)
**Trigger 2**: Forced to upgrade to Supabase Team ($599/month)
**Trigger 3**: Need custom PostgreSQL extensions not in Supabase
**Trigger 4**: Database queries > 100,000/day with complex joins

**Estimated timeline**: Year 3-4 (2028-2029) at earliest

---

## ⚡ Quick Decision Matrix

| Factor | Supabase | Cloud SQL |
|--------|----------|-----------|
| **Cost (0-1K users)** | ✅✅✅ $25/mo | ❌ $41/mo |
| **Cost (1K-5K users)** | ✅✅ $25-50/mo | ❌ $79-175/mo |
| **Cost (5K-10K users)** | ⚠️ $50-599/mo | ✅ $313/mo |
| **Cost (10K+ users)** | ❌ $599-5K/mo | ✅ $1.4K-2K/mo |
| **Setup time** | ✅✅✅ 1 hour | ❌ 1-2 days |
| **DevOps overhead** | ✅✅✅ None | ❌ Medium-High |
| **Bundled features** | ✅✅✅ Many | ❌ Database only |
| **Flexibility** | ⚠️ Limited | ✅✅ Full control |
| **Scaling ceiling** | ⚠️ Medium | ✅✅✅ Very high |
| **PostgreSQL control** | ⚠️ Limited | ✅✅✅ Full |
| **Migration ease** | ✅✅ Easy | ✅✅ Easy |

---

## 💰 Final Answer

### For TradeTaper: **Supabase is 72% cheaper over 3 years**

**Supabase Pro**: $1,560 (3 years)
**Cloud SQL**: $5,652 (3 years)

**Recommendation**:
1. **Stay on Supabase** (verify you're on Pro, not Free)
2. **Delete the unused Cloud SQL instance** (save $10-15/month immediately)
3. **Re-evaluate in Year 3** when you hit 5,000-10,000 users
4. **Budget for potential migration** to Cloud SQL in 2028-2029 if needed

### Action Items

- [ ] Verify current Supabase tier (https://app.supabase.com/)
- [ ] If Free tier: Upgrade to Pro ($25/month) for production
- [ ] Delete Cloud SQL instance (save $10-15/month)
- [ ] Monitor Supabase usage monthly (connections, storage, bandwidth)
- [ ] Set calendar reminder for Year 3 (2028) to re-evaluate

---

## 📚 References

- [Supabase Pricing](https://supabase.com/pricing)
- [Cloud SQL Pricing](https://cloud.google.com/sql/pricing)
- [PostgreSQL Connection Pooling](https://www.postgresql.org/docs/current/runtime-config-connection.html)
- [Database Cost Optimization Guide](https://cloud.google.com/architecture/cost-optimization-for-databases)

---

**Created**: February 9, 2026
**Decision**: **Supabase for next 2-3 years**
**Estimated Savings**: **$4,092 over 3 years**
**Next Review**: Q1 2028
