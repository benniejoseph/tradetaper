#!/bin/bash

# Setup script for Stripe integration in TradeTaper backend
echo "🔧 Setting up Stripe integration..."

# Export test environment variables (replace with your actual keys)
export STRIPE_SECRET_KEY="sk_test_REPLACE_WITH_YOUR_ACTUAL_STRIPE_TEST_KEY"
export STRIPE_PUBLISHABLE_KEY="pk_test_your_stripe_publishable_key_here"
export STRIPE_WEBHOOK_SECRET="whsec_REPLACE_WITH_YOUR_WEBHOOK_SECRET"
export DB_HOST=localhost
export DB_PORT=5435
export DB_USERNAME=bennie
export DB_PASSWORD=tradetaperpass
export DB_DATABASE=tradetaper_dev
export JWT_SECRET=your-jwt-secret-here
export NODE_ENV=development
export PORT=3000

echo "✅ Stripe environment variables set"
echo "📋 Testing Stripe connection..."

# Run the Stripe integration test
npx ts-node src/subscriptions/test-stripe-integration.ts

echo "🎉 Stripe setup complete!"
echo "💡 Remember to update your .env file with actual Stripe keys"

echo ""
echo "📋 Next Steps:"
echo "1. Go to your Stripe Dashboard: https://dashboard.stripe.com/test"
echo "2. Create Products and Prices:"
echo "   - Free: $0 (for default users)"
echo "   - Starter: $9.99/month"
echo "   - Professional: $19.99/month"
echo "   - Enterprise: $49.99/month"
echo ""
echo "3. Set up Customer Portal:"
echo "   - Go to: https://dashboard.stripe.com/test/settings/billing/portal"
echo "   - Enable customer portal and save settings"
echo ""
echo "4. Set up Webhooks:"
echo "   - Go to: https://dashboard.stripe.com/test/webhooks"
echo "   - Add endpoint: https://your-domain.com/api/webhooks/stripe"
echo "   - Select these events:"
echo "     • checkout.session.completed"
echo "     • customer.subscription.created"
echo "     • customer.subscription.updated"
echo "     • customer.subscription.deleted"
echo "     • invoice.payment_succeeded"
echo "     • invoice.payment_failed"
echo ""
echo "5. Update price IDs in src/subscriptions/services/subscription.service.ts"
echo "   - Replace the mapPriceIdToTier function with your actual Stripe price IDs"
echo ""
echo "6. Create your .env file with these variables (copy the ones shown above)"
echo ""
echo "7. Start the backend:"
echo "   npm run start:dev"
echo ""
echo "8. Test the integration with your frontend!"
echo ""
echo "🎉 Stripe integration is ready for configuration!" 