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
import { CreateCheckoutSessionDto } from './dto/create-checkout-session.dto';
import { AuthenticatedRequest } from '../types/authenticated-request.interface';

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

export class CreateRazorpaySubscriptionDto {
    @IsString()
    @IsNotEmpty()
    planId: string;

    @IsString()
    @IsNotEmpty()
    period: 'monthly' | 'yearly';
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
    const userId = req.user.userId;
    if (!userId) {
      throw new Error('User ID not found on request');
    }
    return this.subscriptionService.createCheckoutSession(
      userId,
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
    const userId = req.user.userId;
    if (!userId) {
      throw new Error('User ID not found on request');
    }
    return this.subscriptionService.createPortalSession(
      userId,
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
    const userId = req.user.userId;
    if (!userId) {
      throw new Error('User ID not found on request');
    }
    return this.subscriptionService.createPaymentLink(
      userId,
      createPaymentLinkDto.priceId,
    );
  }

  @Post('create-razorpay-subscription')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async createRazorpaySubscription(
    @Body() dto: CreateRazorpaySubscriptionDto,
    @Req() req: AuthenticatedRequest,
  ) { 
    return this.subscriptionService.createRazorpaySubscription(
        req.user.userId,
        dto.planId,
        dto.period
    );
  }

  @Get('current')
  @UseGuards(JwtAuthGuard)
  async getCurrentSubscription(
    @Req() req: AuthenticatedRequest,
  ): Promise<BillingInfo> {
    const userId = req.user.userId;
    if (!userId) {
      throw new Error('User ID not found on request');
    }
    return this.subscriptionService.getCurrentSubscription(userId);
  }

  @Get('usage')
  @UseGuards(JwtAuthGuard)
  getUsage(@Req() req: AuthenticatedRequest): SubscriptionUsage {
    const userId = req.user.userId;
    if (!userId) {
      throw new Error('User ID not found on request');
    }
    return this.subscriptionService.getCurrentUsage(userId);
  }

  @Get('feature-access/:feature')
  @UseGuards(JwtAuthGuard)
  async checkFeatureAccess(
    @Req() req: AuthenticatedRequest,
    @Param('feature') feature: string,
  ) {
    const userId = req.user.userId;
    if (!userId) {
      throw new Error('User ID not found on request');
    }
    return {
      hasAccess: await this.subscriptionService.hasFeatureAccess(
        userId,
        feature,
      ),
    };
  }
}
