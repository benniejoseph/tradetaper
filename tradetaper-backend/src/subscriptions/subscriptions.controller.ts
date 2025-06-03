import {
  Controller,
  Post,
  Get,
  Body,
  Req,
  UseGuards,
  HttpCode,
  HttpStatus,
  Param,
} from '@nestjs/common';
import { Request } from 'express';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import {
  SubscriptionService,
  BillingInfo,
  SubscriptionUsage,
} from './services/subscription.service';

export class CreateCheckoutSessionDto {
  priceId: string;
  successUrl: string;
  cancelUrl: string;
}

export class CreatePortalSessionDto {
  returnUrl: string;
}

interface AuthenticatedRequest extends Request {
  user: {
    id: string;
  };
}

@Controller('subscriptions')
export class SubscriptionsController {
  constructor(private readonly subscriptionService: SubscriptionService) {}

  @Get('pricing-plans')
  getPricingPlans() {
    return this.subscriptionService.getPricingPlans();
  }

  @Post('create-checkout-session')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async createCheckoutSession(
    @Body() createCheckoutSessionDto: CreateCheckoutSessionDto,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.subscriptionService.createCheckoutSession(
      req.user.id,
      createCheckoutSessionDto.priceId,
      createCheckoutSessionDto.successUrl,
      createCheckoutSessionDto.cancelUrl,
    );
  }

  @Post('create-portal-session')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async createPortalSession(
    @Body() createPortalSessionDto: CreatePortalSessionDto,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.subscriptionService.createPortalSession(
      req.user.id,
      createPortalSessionDto.returnUrl,
    );
  }

  @Get('current')
  @UseGuards(JwtAuthGuard)
  async getCurrentSubscription(
    @Req() req: AuthenticatedRequest,
  ): Promise<BillingInfo> {
    return this.subscriptionService.getCurrentSubscription(req.user.id);
  }

  @Get('usage')
  @UseGuards(JwtAuthGuard)
  async getUsage(@Req() req: AuthenticatedRequest): Promise<SubscriptionUsage> {
    return this.subscriptionService.getCurrentUsage(req.user.id);
  }

  @Get('feature-access/:feature')
  @UseGuards(JwtAuthGuard)
  async checkFeatureAccess(
    @Req() req: AuthenticatedRequest,
    @Param('feature') feature: string,
  ) {
    return {
      hasAccess: await this.subscriptionService.hasFeatureAccess(
        req.user.id,
        feature,
      ),
    };
  }
} 