import { ConfigService } from '@nestjs/config';
import Stripe from 'stripe';
export declare class StripeService {
    private configService;
    private readonly logger;
    private stripe;
    constructor(configService: ConfigService);
    getStripe(): Stripe;
    createCustomer(email: string, name?: string): Promise<Stripe.Customer>;
    createCheckoutSession(priceId: string, customerId: string, successUrl: string, cancelUrl: string, userId: string): Promise<Stripe.Checkout.Session>;
    createPaymentLink(userId: string, priceId: string, customerId: string): Promise<{
        paymentLinkId: string;
        url: string;
    }>;
    createBillingPortalSession(customerId: string, returnUrl: string): Promise<Stripe.BillingPortal.Session>;
    getSubscription(subscriptionId: string): Promise<Stripe.Subscription>;
    cancelSubscription(subscriptionId: string): Promise<Stripe.Subscription>;
    reactivateSubscription(subscriptionId: string): Promise<Stripe.Subscription>;
    updateSubscription(subscriptionId: string, newPriceId: string): Promise<Stripe.Subscription>;
    getUpcomingInvoice(customerId: string): Promise<Stripe.Invoice | null>;
    getCustomerPaymentMethods(customerId: string): Promise<Stripe.PaymentMethod[]>;
    constructWebhookEvent(payload: Buffer, signature: string): Stripe.Event;
}
