import {
  Controller,
  Post,
  Headers,
  HttpCode,
  HttpStatus,
  Logger,
  RawBodyRequest,
  Req,
} from '@nestjs/common';
import { Request } from 'express';
import { SubscriptionService } from './services/subscription.service';
import { StripeService } from './services/stripe.service';

@Controller('webhooks')
export class WebhooksController {
  private readonly logger = new Logger(WebhooksController.name);

  constructor(
    private readonly subscriptionService: SubscriptionService,
    private readonly stripeService: StripeService,
  ) {}

  @Post('webhook')
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

      event = this.stripeService.constructWebhookEvent(
        request.rawBody,
        signature,
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
