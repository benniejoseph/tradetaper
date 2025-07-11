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
import { IsString, IsNotEmpty, IsUrl } from 'class-validator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import {
  SubscriptionService,
  BillingInfo,
  SubscriptionUsage,
} from './services/subscription.service';

export class CreateCheckoutSessionDto {
  @IsString()
  @IsNotEmpty()
  priceId: string;

  @IsString()
  @IsNotEmpty()
  @IsUrl()
  successUrl: string;

  @IsString()
  @IsNotEmpty()
  @IsUrl()
  cancelUrl: string;
}

export class CreatePortalSessionDto {
  @IsString()
  @IsNotEmpty()
  @IsUrl()
  returnUrl: string;
}

export class CreatePaymentLinkDto {
  @IsString()
  @IsNotEmpty()
  priceId: string;
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

  @Post('create-payment-link')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async createPaymentLink(
    @Body() createPaymentLinkDto: CreatePaymentLinkDto,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.subscriptionService.createPaymentLink(
      req.user.id,
      createPaymentLinkDto.priceId,
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
  getUsage(@Req() req: AuthenticatedRequest): SubscriptionUsage {
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
