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
import { AuthenticatedRequest } from '../types/authenticated-request.interface';
import {
  SubscriptionService,
  BillingInfo,
  SubscriptionUsage,
} from './services/subscription.service';

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

  @Post('create-razorpay-subscription')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async createRazorpaySubscription(
    @Body() dto: CreateRazorpaySubscriptionDto,
    @Req() req: AuthenticatedRequest,
  ) { 
    return this.subscriptionService.createRazorpaySubscription(
        req.user.id,
        dto.planId,
        dto.period
    );
  }

  @Get('current')
  @UseGuards(JwtAuthGuard)
  async getCurrentSubscription(
    @Req() req: AuthenticatedRequest,
  ): Promise<BillingInfo> {
    const userId = req.user.id;
    if (!userId) {
      throw new Error('User ID not found on request');
    }
    return this.subscriptionService.getCurrentSubscription(userId);
  }

  @Get('usage')
  @UseGuards(JwtAuthGuard)
  async getUsage(@Req() req: AuthenticatedRequest): Promise<SubscriptionUsage> {
    const userId = req.user.id;
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
    const userId = req.user.id;
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
