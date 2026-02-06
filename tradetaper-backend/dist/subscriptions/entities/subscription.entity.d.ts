import { User } from '../../users/entities/user.entity';
export declare enum SubscriptionStatus {
    ACTIVE = "active",
    CANCELED = "canceled",
    INCOMPLETE = "incomplete",
    INCOMPLETE_EXPIRED = "incomplete_expired",
    PAST_DUE = "past_due",
    TRIALING = "trialing",
    UNPAID = "unpaid"
}
export declare enum SubscriptionTier {
    FREE = "free",
    ESSENTIAL = "essential",
    PREMIUM = "premium"
}
export declare class Subscription {
    id: string;
    userId: string;
    user: User;
    stripeCustomerId: string;
    stripeSubscriptionId: string;
    stripePriceId: string;
    razorpayCustomerId: string;
    razorpaySubscriptionId: string;
    razorpayPlanId: string;
    status: SubscriptionStatus;
    tier: SubscriptionTier;
    plan: string;
    price: number;
    interval: string;
    currentPeriodStart: Date;
    currentPeriodEnd: Date;
    cancelAtPeriodEnd: boolean;
    canceledAt: Date | null;
    trialStart: Date;
    trialEnd: Date;
    createdAt: Date;
    updatedAt: Date;
}
