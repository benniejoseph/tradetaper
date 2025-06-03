# Stripe Integration for TradeTaper Frontend

## Environment Variables Setup

Create a `.env.local` file in the frontend directory with:

```bash
# Stripe Configuration
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_REPLACE_WITH_YOUR_PUBLISHABLE_KEY
STRIPE_SECRET_KEY=sk_test_REPLACE_WITH_YOUR_ACTUAL_STRIPE_TEST_KEY

# API Configuration  
NEXT_PUBLIC_API_URL=https://your-backend-url.railway.app/api/v1
```

## Frontend Components

### 1. Pricing Page Integration

The pricing components automatically handle Stripe checkout:

```tsx
import { PricingCard } from '@/components/pricing/PricingCard';

// Pricing cards will automatically redirect to Stripe checkout
<PricingCard 
  plan="pro"
  onSubscribe={handleStripeCheckout} // This triggers Stripe checkout
/>
```

### 2. Subscription Management

```tsx
import { useSubscription } from '@/hooks/useSubscription';

function SubscriptionPage() {
  const { subscription, loading, error } = useSubscription();
  
  return (
    <div>
      {subscription ? (
        <SubscriptionDetails subscription={subscription} />
      ) : (
        <UpgradePrompt />
      )}
    </div>
  );
}
```

## Backend Integration Points

### 1. Checkout Session Creation

```typescript
// Frontend calls this endpoint to create checkout session
POST /api/v1/subscriptions/create-checkout-session
{
  "priceId": "price_xxxxx",
  "userId": "user_xxxxx"
}
```

### 2. Webhook Handling

The backend handles these Stripe events:
- `checkout.session.completed` - Creates subscription
- `customer.subscription.updated` - Updates subscription status
- `customer.subscription.deleted` - Handles cancellations

### 3. Subscription Status Check

```typescript
// Check current subscription status
GET /api/v1/subscriptions/status
Authorization: Bearer {token}
```

## Testing

1. Use Stripe test cards:
   - Success: `4242424242424242`
   - Declined: `4000000000000002`

2. Test webhooks locally with Stripe CLI:
```bash
stripe listen --forward-to localhost:3000/api/v1/webhooks/stripe
```

## Important Notes

- All test keys should start with `sk_test_` or `pk_test_`
- Never commit real API keys to version control
- Use environment variables for all sensitive configuration
- Test thoroughly with Stripe test data before going live

## Overview
This document outlines the complete Stripe integration for TradeTaper's subscription system.

## Configuration

### Environment Variables

**Backend (.env):**
```bash
STRIPE_SECRET_KEY=sk_test_your_stripe_secret_key_here
STRIPE_PUBLISHABLE_KEY=pk_test_your_stripe_publishable_key_here
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret_here
```

**Frontend (.env.local):**
```bash
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_your_stripe_publishable_key_here
NEXT_PUBLIC_API_URL=http://localhost:3000
```

## Getting Your Stripe Keys

1. Go to [Stripe Dashboard](https://dashboard.stripe.com)
2. Make sure you're in **Test mode** (toggle in top left)
3. Go to **Developers > API keys**
4. Copy your **Publishable key** and **Secret key**
5. For webhooks, go to **Developers > Webhooks** and create an endpoint

## Subscription Tiers

### Tier Configuration
- **Free Tier**: No payment required
- **Basic Tier**: $9.99/month
- **Professional Tier**: $19.99/month
- **Enterprise Tier**: $39.99/month

### Price IDs (Update these with your actual Stripe price IDs)
```typescript
const PRICE_MAP = {
  basic: 'price_basic_monthly_id',
  professional: 'price_professional_monthly_id',
  enterprise: 'price_enterprise_monthly_id',
};
```

## Testing Stripe Integration

### Test Credit Cards
Use these test card numbers in Stripe test mode:

- **Successful payment**: 4242 4242 4242 4242
- **Declined payment**: 4000 0000 0000 0002
- **Requires authentication**: 4000 0027 6000 3184

Use any future expiry date, any 3-digit CVC, and any zip code.

## API Endpoints

### Subscription Management
- `POST /api/v1/subscriptions/create-checkout-session` - Create payment session
- `POST /api/v1/subscriptions/create-portal-session` - Customer portal
- `POST /api/v1/webhooks/stripe` - Webhook handler
- `GET /api/v1/subscriptions/current` - Get current subscription

## Frontend Integration

### Components
- `SubscriptionPlans` - Displays pricing tiers
- `PaymentForm` - Handles checkout process
- `BillingPage` - Manages subscription

### Usage Flow
1. User selects a plan
2. Redirected to Stripe Checkout
3. Payment processed
4. Webhook updates subscription status
5. User redirected back to success page

## Webhook Configuration

### Required Events
- `customer.subscription.created`
- `customer.subscription.updated` 
- `customer.subscription.deleted`
- `invoice.payment_succeeded`
- `invoice.payment_failed`

### Webhook URL
Set your webhook endpoint to: `https://your-domain.com/api/v1/webhooks/stripe`

## Security Considerations

1. **Never expose secret keys** in frontend code
2. **Validate webhook signatures** using webhook secret
3. **Use HTTPS** in production
4. **Store sensitive data securely**
5. **Implement proper error handling**

## Production Checklist

- [ ] Switch to live Stripe keys
- [ ] Update webhook URL to production domain
- [ ] Test with real payment methods
- [ ] Set up monitoring for failed payments
- [ ] Configure customer email notifications
- [ ] Set up subscription analytics

## Troubleshooting

### Common Issues

1. **Invalid API Key**: Check environment variables
2. **Webhook not working**: Verify webhook secret and URL
3. **Payment failed**: Check test card numbers
4. **CORS errors**: Ensure proper domain configuration

### Debug Steps
1. Check browser console for errors
2. Verify Stripe dashboard for payment attempts
3. Check webhook delivery status
4. Review application logs

## Support

- [Stripe Documentation](https://stripe.com/docs)
- [Stripe Testing Guide](https://stripe.com/docs/testing)
- [Webhook Testing](https://stripe.com/docs/webhooks/test) 