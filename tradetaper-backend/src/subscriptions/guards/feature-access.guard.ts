import {
  CanActivate,
  ExecutionContext,
  Injectable,
  SetMetadata,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { SubscriptionService } from '../services/subscription.service';
import { AiQuotaService } from '../../ai/ai-quota.service';

export const FEATURE_ACCESS_KEY = 'featureAccess';

export const RequireFeature = (feature: string) =>
  SetMetadata(FEATURE_ACCESS_KEY, feature);

/** Features that consume a per-user monthly AI quota */
const AI_QUOTA_FEATURES = new Set(['aiAnalysis', 'chartAnalysis', 'psychology', 'mentor']);

@Injectable()
export class FeatureAccessGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private subscriptionService: SubscriptionService,
    private aiQuotaService: AiQuotaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const feature = this.reflector.getAllAndOverride<string>(
      FEATURE_ACCESS_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!feature) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const userId = request.user?.id;

    if (!userId) {
      throw new ForbiddenException('User not authenticated');
    }

    const hasAccess = await this.subscriptionService.hasFeatureAccess(
      userId,
      feature,
    );

    if (!hasAccess) {
      throw new ForbiddenException(
        `Your plan does not have access to ${feature} feature. Please upgrade your subscription.`,
      );
    }

    // For AI-consuming features, enforce per-user monthly quota
    if (AI_QUOTA_FEATURES.has(feature)) {
      const subscription = await this.subscriptionService.getOrCreateSubscription(userId);
      // checkAndIncrement throws 403/429 automatically if over quota
      await this.aiQuotaService.checkAndIncrement(userId, subscription.plan);
    }

    return true;
  }
}
