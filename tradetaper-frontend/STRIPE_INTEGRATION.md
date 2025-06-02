# Stripe Payment Integration - TradeTaper

## Overview
TradeTaper now includes a comprehensive Stripe payment integration with subscription management, usage limits, and billing features.

## Features Implemented

### 1. Subscription Tiers
- **Free**: 10 trades/month, 1 account
- **Starter**: $9.99/month - 100 trades, 3 accounts
- **Professional**: $19.99/month - 500 trades, 10 accounts (Recommended)
- **Enterprise**: $49.99/month - Unlimited trades/accounts

### 2. Annual Billing
- 17% discount on all paid plans when billed annually
- Automatic savings calculation and display

### 3. Core Components

#### Frontend Components
- `PricingCard` - Individual subscription tier display with Stripe checkout
- `PricingPage` - Complete pricing page with billing toggle and feature comparison
- `BillingPage` - Subscription management and billing history
- `BillingSuccessPage` - Payment confirmation page
- `UsageLimitGuard` - Usage limit enforcement component

#### State Management
- `subscriptionSlice` - Redux store for subscription and billing state
- Async thunks for API operations
- Selectors for component data access

#### API Services
- `pricingApi` - Stripe and subscription API client
- Checkout session creation
- Billing portal access
- Subscription management

### 4. Usage Limit Enforcement
- Real-time usage tracking
- Visual progress bars and warnings
- Automatic upgrade prompts when limits reached
- Graceful fallbacks for free tier users

## File Structure

```
src/
├── types/
│   └── pricing.ts              # TypeScript interfaces
├── lib/
│   └── stripe.ts               # Stripe client configuration
├── config/
│   └── pricing.ts              # Pricing tiers and configuration
├── services/
│   └── pricingApi.ts           # API service functions
├── store/features/
│   └── subscriptionSlice.ts    # Redux state management
├── components/
│   ├── pricing/
│   │   └── PricingCard.tsx     # Individual pricing tier
│   └── subscription/
│       └── UsageLimitGuard.tsx # Usage limit enforcement
└── app/(app)/
    ├── pricing/
    │   └── page.tsx            # Main pricing page
    ├── billing/
    │   ├── page.tsx            # Billing management
    │   └── success/
    │       └── page.tsx        # Payment success page
```

## Environment Variables

```bash
# Frontend (.env.local)
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_51HCsYUKCBJK5GhoVW20cTDcwCJvPbGMSSU57Oo0Dfr1tVVmhXMmPJlqiFFaXW5qHjaXc7QcuIIlWzyqk8aHssZxh002dpfXexM

# Backend (when implemented)
STRIPE_SECRET_KEY=sk_test_51HCsYUKCBJK5GhoVRw2fa2u59R2biPCde1MCP2IU8MSz92deeKHrD0FKAReXFeOpqWiN387NoeauU3pFCy3k18sS000AokIvgM
STRIPE_WEBHOOK_SECRET=whsec_...
```

## Usage Examples

### 1. Basic Pricing Display
```tsx
import PricingCard from '@/components/pricing/PricingCard';
import { PRICING_TIERS } from '@/config/pricing';

export default function MyPricingPage() {
  return (
    <div className="grid grid-cols-4 gap-6">
      {PRICING_TIERS.map(tier => (
        <PricingCard 
          key={tier.id} 
          tier={tier} 
          isPopular={tier.recommended}
        />
      ))}
    </div>
  );
}
```

### 2. Usage Limit Enforcement
```tsx
import UsageLimitGuard from '@/components/subscription/UsageLimitGuard';
import TradeForm from '@/components/trades/TradeForm';

export default function NewTradePage() {
  return (
    <UsageLimitGuard feature="trades">
      <TradeForm />
    </UsageLimitGuard>
  );
}
```

### 3. Subscription Status Check
```tsx
import { useSelector } from 'react-redux';
import { selectCurrentSubscription } from '@/store/features/subscriptionSlice';

export default function FeatureComponent() {
  const subscription = useSelector(selectCurrentSubscription);
  const isPremium = subscription && subscription.status === 'active';

  return (
    <div>
      {isPremium ? (
        <PremiumFeature />
      ) : (
        <UpgradePrompt />
      )}
    </div>
  );
}
```

## Navigation Integration

### Updated Navigation Items
- Added "Billing" to user navigation in sidebar
- Added "Pricing" to footer navigation
- Billing icon shows subscription status

### Usage Hooks
```tsx
import { useCanPerformAction } from '@/components/subscription/UsageLimitGuard';

export default function AddTradeButton() {
  const canAddTrade = useCanPerformAction('trades');
  
  return (
    <button disabled={!canAddTrade}>
      {canAddTrade ? 'Add Trade' : 'Upgrade to Add Trades'}
    </button>
  );
}
```

## Stripe Checkout Flow

1. User selects a pricing tier
2. `PricingCard` calls `pricingApi.createCheckoutSession()`
3. User is redirected to Stripe Checkout
4. After payment, user returns to `/billing/success`
5. Subscription status is updated in Redux store

## Backend Requirements (To Be Implemented)

### Required API Endpoints
```
POST /api/subscriptions/create-checkout-session
GET  /api/subscriptions/current
GET  /api/subscriptions/billing-info
GET  /api/subscriptions/usage
POST /api/subscriptions/cancel
POST /api/subscriptions/reactivate
POST /api/subscriptions/update
POST /api/subscriptions/create-portal-session
POST /api/webhooks/stripe
```

### Stripe Webhook Events to Handle
- `checkout.session.completed`
- `customer.subscription.created`
- `customer.subscription.updated`
- `customer.subscription.deleted`
- `invoice.payment_succeeded`
- `invoice.payment_failed`

## Testing

### Test Cards (Stripe Test Mode)
- Success: `4242424242424242`
- Declined: `4000000000000002`
- 3D Secure: `4000002500003155`

### Test Flow
1. Navigate to `/pricing`
2. Select a paid tier
3. Use test card information
4. Complete checkout
5. Verify subscription in `/billing`

## Security Considerations

1. **API Keys**: Never expose secret keys to frontend
2. **Webhook Verification**: Always verify webhook signatures
3. **User Authorization**: Ensure users can only access their own billing data
4. **Price Validation**: Validate prices server-side, not client-side

## Customization

### Adding New Pricing Tiers
1. Update `PRICING_TIERS` in `src/config/pricing.ts`
2. Create corresponding Stripe Price IDs
3. Update backend validation logic

### Modifying Usage Limits
1. Update tier definitions in pricing config
2. Adjust `UsageLimitGuard` thresholds if needed
3. Update backend usage tracking

## Known Limitations

1. Test mode only - production keys needed for live payments
2. Backend API endpoints need implementation
3. Webhook handling requires server setup
4. Usage tracking needs database integration

## Next Steps

1. Implement backend Stripe integration
2. Set up webhook handling
3. Add invoice download functionality
4. Implement usage tracking in database
5. Add payment method management
6. Set up production Stripe account 