import { loadStripe } from '@stripe/stripe-js';

// Load Stripe with publishable key
export const stripePromise = loadStripe(
  process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || 'pk_test_51HCsYUKCBJK5GhoVW20cTDcwCJvPbGMSSU57Oo0Dfr1tVVmhXMmPJlqiFFaXW5qHjaXc7QcuIIlWzyqk8aHssZxh002dpfXexM'
);

export const getStripeInstance = async () => {
  const stripe = await stripePromise;
  if (!stripe) {
    throw new Error('Stripe failed to load');
  }
  return stripe;
}; 