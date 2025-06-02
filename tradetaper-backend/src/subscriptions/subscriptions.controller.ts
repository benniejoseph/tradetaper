import {
  Controller,
  Post,
  Get,
  Put,
  Delete,
  Body,
  Req,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { Request } from 'express';
import { SubscriptionService, BillingInfo, SubscriptionUsage } from './services/subscription.service';
import { CreateCheckoutSessionDto } from './dto/create-checkout-session.dto';
import { CreatePortalSessionDto } from './dto/create-portal-session.dto';
import { UpdateSubscriptionDto } from './dto/update-subscription.dto';

// Assuming you have an auth guard - replace with your actual auth implementation
interface AuthenticatedRequest extends Request {
  user: {
    id: string;
  };
}

@Controller('subscriptions')
export class SubscriptionsController {
  constructor(private readonly subscriptionService: SubscriptionService) {}

  @Post('create-checkout-session')
  @HttpCode(HttpStatus.OK)
  async createCheckoutSession(
    @Body() createCheckoutSessionDto: CreateCheckoutSessionDto,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.subscriptionService.createCheckoutSession(
      req.user.id,
      createCheckoutSessionDto,
    );
  }

  @Post('create-portal-session')
  @HttpCode(HttpStatus.OK)
  async createPortalSession(
    @Body() createPortalSessionDto: CreatePortalSessionDto,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.subscriptionService.createPortalSession(
      req.user.id,
      createPortalSessionDto,
    );
  }

  @Get('current')
  async getCurrentSubscription(@Req() req: AuthenticatedRequest) {
    return this.subscriptionService.getCurrentSubscription(req.user.id);
  }

  @Get('billing-info')
  async getBillingInfo(@Req() req: AuthenticatedRequest): Promise<BillingInfo> {
    return this.subscriptionService.getBillingInfo(req.user.id);
  }

  @Get('usage')
  async getUsage(@Req() req: AuthenticatedRequest): Promise<SubscriptionUsage> {
    return this.subscriptionService.getUsage(req.user.id);
  }

  @Post('cancel')
  @HttpCode(HttpStatus.OK)
  async cancelSubscription(@Req() req: AuthenticatedRequest) {
    return this.subscriptionService.cancelSubscription(req.user.id);
  }

  @Post('reactivate')
  @HttpCode(HttpStatus.OK)
  async reactivateSubscription(@Req() req: AuthenticatedRequest) {
    return this.subscriptionService.reactivateSubscription(req.user.id);
  }

  @Put('update')
  async updateSubscription(
    @Body() updateSubscriptionDto: UpdateSubscriptionDto,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.subscriptionService.updateSubscription(
      req.user.id,
      updateSubscriptionDto,
    );
  }
} 