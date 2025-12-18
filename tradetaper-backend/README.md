# TradeTaper Backend

## Current Payment System Status

### ⚠️ **IMPORTANT: Indian Stripe Account Restriction**

The current Stripe integration is blocked due to Indian regulatory requirements:

**Error**: "As per Indian regulations, only registered Indian businesses (i.e. sole proprietorships, limited liability partnerships and companies, but not individuals) can accept international payments"

**Affected Endpoints**:
- `POST /api/v1/subscriptions/create-checkout-session` → 500 Error
- `POST /api/v1/subscriptions/create-payment-link` → 500 Error

### ✅ **Working Systems**
- ✅ Authentication & User Management
- ✅ Subscription Plans & Current Status
- ✅ Database Schema & Migrations  
- ✅ Market Data API
- ✅ Enhanced Error Logging
- ✅ Comprehensive Stripe Debugging

### 🔧 **Solution Options**

#### Option 1: Business Registration (Recommended)
1. Register TradeTaper as Indian business entity
2. Update Stripe account with business documentation
3. Enable international payments for registered business

#### Option 2: International Account Setup
1. Create Stripe account in US/Singapore
2. Set up international business entity
3. Migrate Stripe products to new account

#### Option 3: Alternative Payment Processor
1. **Razorpay**: Indian-focused, easier compliance
2. **PayPal**: Simple international setup
3. **Paddle**: Merchant of record handling compliance

### 🧪 **Testing Endpoints**

#### Debugging
```bash
# Comprehensive Stripe testing
curl -X POST https://tradetaper-backend-326520250422.us-central1.run.app/api/v1/debug-stripe

# Database schema verification
curl -X POST https://tradetaper-backend-326520250422.us-central1.run.app/api/v1/debug-subscription \
  -H "Content-Type: application/json" \
  -d '{"userId": "test-user-id"}'
```

#### Working Subscription Endpoints
```bash
# Get pricing plans
curl https://tradetaper-backend-326520250422.us-central1.run.app/api/v1/subscriptions/pricing-plans

# Get current subscription (requires auth)
curl https://tradetaper-backend-326520250422.us-central1.run.app/api/v1/subscriptions/current \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

#### Blocked Payment Endpoints
```bash
# These will return 500 errors due to Indian Stripe restrictions
curl -X POST https://tradetaper-backend-326520250422.us-central1.run.app/api/v1/subscriptions/create-checkout-session
curl -X POST https://tradetaper-backend-326520250422.us-central1.run.app/api/v1/subscriptions/create-payment-link
```

### 🎯 **Immediate Action Required**

To enable payment processing, choose one of the solution options above and implement the necessary business/account changes.

The technical implementation is complete and ready - only the Stripe account configuration needs to be resolved. 