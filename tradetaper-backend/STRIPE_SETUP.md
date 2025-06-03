# Stripe Setup Guide

## Current Issue: Indian Account Restrictions

The current Stripe account is restricted due to Indian regulations requiring business registration for international payments.

## Environment Variables Required

```bash
# Stripe Configuration
STRIPE_SECRET_KEY=sk_test_your_stripe_secret_key
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret

# Stripe Product IDs (create these in your Stripe dashboard)
STRIPE_PRODUCT_STARTER=prod_starter_product_id
STRIPE_PRODUCT_PROFESSIONAL=prod_professional_product_id  
STRIPE_PRODUCT_ENTERPRISE=prod_enterprise_product_id

# Stripe Price IDs (create these in your Stripe dashboard)
STRIPE_PRICE_STARTER_MONTHLY=price_starter_monthly_id
STRIPE_PRICE_STARTER_YEARLY=price_starter_yearly_id
STRIPE_PRICE_PROFESSIONAL_MONTHLY=price_professional_monthly_id
STRIPE_PRICE_PROFESSIONAL_YEARLY=price_professional_yearly_id
STRIPE_PRICE_ENTERPRISE_MONTHLY=price_enterprise_monthly_id
STRIPE_PRICE_ENTERPRISE_YEARLY=price_enterprise_yearly_id
```

## New Account Setup Steps

### Option 1: New International Stripe Account

1. **Create Account**: Set up Stripe account in US/Singapore/UK
2. **Business Setup**: Register business entity if required by jurisdiction
3. **Create Products**:
   ```bash
   # Use Stripe CLI to create products
   stripe products create --name "TradeTaper Starter" --description "Essential trading journal for beginners"
   stripe products create --name "TradeTaper Professional" --description "Advanced trading journal for serious traders"
   stripe products create --name "TradeTaper Enterprise" --description "Premium solution for professional traders"
   ```

4. **Create Prices**:
   ```bash
   # Starter Plan
   stripe prices create --product prod_starter_id --unit-amount 999 --currency usd --recurring-interval month
   stripe prices create --product prod_starter_id --unit-amount 9999 --currency usd --recurring-interval year
   
   # Professional Plan  
   stripe prices create --product prod_professional_id --unit-amount 2999 --currency usd --recurring-interval month
   stripe prices create --product prod_professional_id --unit-amount 29999 --currency usd --recurring-interval year
   
   # Enterprise Plan
   stripe prices create --product prod_enterprise_id --unit-amount 9999 --currency usd --recurring-interval month
   stripe prices create --product prod_enterprise_id --unit-amount 99999 --currency usd --recurring-interval year
   ```

5. **Update Railway Environment**: Set all STRIPE_* variables in Railway dashboard
6. **Test**: Use `/api/v1/debug-stripe` endpoint to verify setup

### Option 2: Business Registration in India

1. **Register Business**: Register TradeTaper as business entity in India
2. **Update Stripe Account**: Submit business documents to Stripe
3. **Enable International Payments**: Request activation from Stripe support
4. **Verification**: Test with debug endpoint

### Option 3: Alternative Payment Processors

#### Razorpay Setup
```bash
npm install razorpay
```

#### PayPal Setup  
```bash
npm install paypal-rest-sdk
```

#### Paddle Setup
```bash
npm install paddle-sdk
```

## Testing Payment Integration

After setup, test with:
```bash
# Test Stripe API
curl -X POST https://tradetaper-backend-production.up.railway.app/api/v1/debug-stripe

# Test payment creation (should work after proper setup)
curl -X POST https://tradetaper-backend-production.up.railway.app/api/v1/subscriptions/create-checkout-session \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"priceId": "price_your_new_price_id", "successUrl": "https://your-frontend.com/success", "cancelUrl": "https://your-frontend.com/cancel"}'
```

## Current Pricing Structure

The system is configured for these amounts:
- **Starter**: $9.99/month, $99.99/year
- **Professional**: $29.99/month, $299.99/year  
- **Enterprise**: $99.99/month, $999.99/year

Make sure your Stripe prices match these amounts (in cents). 