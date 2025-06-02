import { Injectable, CanActivate, ExecutionContext, ForbiddenException, SetMetadata } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { SubscriptionService } from '../services/subscription.service';

export const USAGE_FEATURE_KEY = 'usageFeature';

export const UsageFeature = (feature: 'trades' | 'accounts') =>
  SetMetadata(USAGE_FEATURE_KEY, feature);

@Injectable()
export class UsageLimitGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private subscriptionService: SubscriptionService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const feature = this.reflector.getAllAndOverride<'trades' | 'accounts'>(
      USAGE_FEATURE_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!feature) {
      return true; // No usage limit specified
    }

    const request = context.switchToHttp().getRequest();
    const userId = request.user?.id;

    if (!userId) {
      throw new ForbiddenException('User not authenticated');
    }

    const canUse = await this.subscriptionService.checkUsageLimit(userId, feature);

    if (!canUse) {
      throw new ForbiddenException(
        `Usage limit exceeded for ${feature}. Please upgrade your subscription.`,
      );
    }

    return true;
  }
} 