import { CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { SubscriptionService } from '../services/subscription.service';
export declare const USAGE_FEATURE_KEY = "usageFeature";
export declare const UsageFeature: (feature: "trades" | "accounts" | "mt5Accounts" | "notes" | "strategies") => import("@nestjs/common").CustomDecorator<string>;
export declare class UsageLimitGuard implements CanActivate {
    private reflector;
    private subscriptionService;
    constructor(reflector: Reflector, subscriptionService: SubscriptionService);
    canActivate(context: ExecutionContext): Promise<boolean>;
}
