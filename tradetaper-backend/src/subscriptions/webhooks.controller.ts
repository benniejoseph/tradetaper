import {
  Controller,
  Post,
  Body,
  Headers,
  HttpCode,
  HttpStatus,
  Logger,
  RawBodyRequest,
  Req,
} from '@nestjs/common';
import { Request } from 'express';
import { ConfigService } from '@nestjs/config';
import Stripe from 'stripe';
import { SubscriptionService } from './services/subscription.service';

@Controller('webhooks')
export class WebhooksController {
  private readonly logger = new Logger(WebhooksController.name);
  private readonly stripe: Stripe;

  constructor(
    private readonly subscriptionService: SubscriptionService,
    private readonly configService: ConfigService,
  ) {
    const stripeSecretKey = this.configService.get<string>('STRIPE_SECRET_KEY');
    if (!stripeSecretKey) {
      throw new Error('STRIPE_SECRET_KEY is required');
    }

    this.stripe = new Stripe(stripeSecretKey, {
      apiVersion: '2025-05-28.basil',
    });
  }

  @Post('stripe')
  @HttpCode(HttpStatus.OK)
  async handleStripeWebhook(
    @Req() request: RawBodyRequest<Request>,
    @Headers('stripe-signature') signature: string,
  ) {
    let event;

    try {
      if (!request.rawBody) {
        throw new Error('No raw body found in request');
      }

      const webhookSecret = this.configService.get<string>(
        'STRIPE_WEBHOOK_SECRET',
      );
      if (!webhookSecret) {
        throw new Error('STRIPE_WEBHOOK_SECRET is required');
      }

      event = this.stripe.webhooks.constructEvent(
        request.rawBody,
        signature,
        webhookSecret,
      );
    } catch (error) {
      this.logger.error(
        `Webhook signature verification failed: ${error.message}`,
      );
      throw error;
    }

    this.logger.log(`Processing Stripe event: ${event.type}`);

    try {
      // Use the single webhook handler method
      await this.subscriptionService.handleWebhookEvent(event);
      return { received: true };
    } catch (error) {
      this.logger.error(`Error processing webhook: ${error.message}`);
      throw error;
    }
  }
}
