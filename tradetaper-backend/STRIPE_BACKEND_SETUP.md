# TradeTaper Backend - Stripe Integration Setup

## Overview
This document outlines the Stripe payment integration implemented in the TradeTaper backend using NestJS.

## Features Implemented

### 1. Database Entities
- **Subscription Entity**: Tracks user subscriptions with Stripe integration
- **Usage Tracking Entity**: Monitors user activity against subscription limits

### 2. API Endpoints

#### Subscription Management
- `POST /api/subscriptions/create-checkout-session` - Create Stripe checkout session
- `POST /api/subscriptions/create-portal-session` - Create billing portal session
- `GET /api/subscriptions/current` - Get current subscription
- `GET /api/subscriptions/billing-info` - Get billing information
- `GET /api/subscriptions/usage` - Get usage statistics
- `POST /api/subscriptions/cancel` - Cancel subscription
- `POST /api/subscriptions/reactivate` - Reactivate subscription
- `PUT /api/subscriptions/update` - Update subscription plan

#### Webhooks
- `POST /api/webhooks/stripe` - Handle Stripe webhook events

### 3. Services

#### StripeService
- Handles all direct Stripe API interactions
- Customer creation and management
- Checkout session creation
- Billing portal access
- Subscription management
- Payment method handling
- Webhook event construction

#### SubscriptionService
- Business logic for subscription management
- Usage tracking and limit enforcement
- Database operations
- Webhook event processing

### 4. Usage Limits by Tier

| Tier | Monthly Trades | Accounts | Price |
|------|---------------|----------|-------|
| Free | 10 | 1 | $0 |
| Starter | 100 | 3 | $9.99 |
| Professional | 500 | 10 | $19.99 |
| Enterprise | Unlimited | Unlimited | $49.99 |

### 5. Usage Enforcement
- `UsageLimitGuard` - Decorator-based usage limit enforcement
- `@UsageFeature('trades')` - Protect trade creation endpoints
- `@UsageFeature('accounts')` - Protect account creation endpoints

## Environment Variables Required

```env
# Stripe Configuration
STRIPE_SECRET_KEY=sk_test_your_stripe_secret_key
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret

# Database Configuration
DB_HOST=localhost
DB_PORT=5435
DB_USERNAME=your_db_user
DB_PASSWORD=your_db_password
DB_DATABASE=tradetaper_dev
```

## Setup Instructions

### 1. Install Dependencies
```bash
npm install stripe
```

### 2. Configure Environment Variables
Create a `.env` file with the required Stripe keys (see above).

### 3. Database Migration
The entities will be automatically created when you start the application (synchronize: true in TypeORM config).

### 4. Stripe Webhook Configuration
1. In your Stripe Dashboard, go to Webhooks
2. Add endpoint: `https://your-domain.com/api/webhooks/stripe`
3. Select events:
   - `checkout.session.completed`
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_succeeded`
   - `invoice.payment_failed`
4. Copy the webhook secret to your environment variables

### 5. Stripe Products and Prices
Create products and prices in your Stripe Dashboard and update the `mapPriceIdToTier` function in `SubscriptionService` with your actual price IDs.

## Usage Examples

### Protecting Endpoints with Usage Limits
```typescript
@Post('create')
@UseGuards(AuthGuard, UsageLimitGuard)
@UsageFeature('trades')
async createTrade(@Body() createTradeDto: CreateTradeDto, @Req() req) {
  // This endpoint will check if user has remaining trade quota
  const trade = await this.tradesService.create(createTradeDto, req.user.id);
  
  // Increment usage after successful creation
  await this.subscriptionService.incrementTradeUsage(req.user.id);
  
  return trade;
}
```

### Checking Usage Programmatically
```typescript
const canCreateTrade = await this.subscriptionService.checkUsageLimit(userId, 'trades');
if (!canCreateTrade) {
  throw new ForbiddenException('Trade limit exceeded. Please upgrade your subscription.');
}
```

## Testing

### Test Mode
The implementation uses Stripe test keys by default. Use test card numbers:
- Success: `4242424242424242`
- Decline: `4000000000000002`

### Webhook Testing
Use Stripe CLI for local webhook testing:
```bash
stripe listen --forward-to localhost:3000/api/webhooks/stripe
```

## Production Deployment

1. Replace test keys with live Stripe keys
2. Update webhook endpoint URL
3. Configure proper error handling and logging
4. Set up monitoring for webhook failures
5. Implement proper authentication guards

## Security Considerations

- Webhook signature verification is implemented
- All sensitive operations require authentication
- Usage limits are enforced server-side
- Stripe customer IDs are securely stored

## Next Steps

1. Implement proper authentication guards
2. Add email notifications for subscription events
3. Implement dunning management for failed payments
4. Add subscription analytics and reporting
5. Implement team/organization features for Enterprise tier 