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
import { StripeService } from './services/stripe.service';
import { SubscriptionService } from './services/subscription.service';

@Controller('api/webhooks')
export class WebhooksController {
  private readonly logger = new Logger(WebhooksController.name);

  constructor(
    private readonly stripeService: StripeService,
    private readonly subscriptionService: SubscriptionService,
  ) {}

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
      event = this.stripeService.constructEvent(request.rawBody, signature);
    } catch (error) {
      this.logger.error(`Webhook signature verification failed: ${error.message}`);
      throw error;
    }

    this.logger.log(`Processing Stripe event: ${event.type}`);

    try {
      switch (event.type) {
        case 'checkout.session.completed':
          await this.handleCheckoutSessionCompleted(event.data.object);
          break;

        case 'customer.subscription.created':
          await this.subscriptionService.handleSubscriptionCreated(event.data.object);
          break;

        case 'customer.subscription.updated':
          await this.subscriptionService.handleSubscriptionUpdated(event.data.object);
          break;

        case 'customer.subscription.deleted':
          await this.subscriptionService.handleSubscriptionDeleted(event.data.object);
          break;

        case 'invoice.payment_succeeded':
          await this.handleInvoicePaymentSucceeded(event.data.object);
          break;

        case 'invoice.payment_failed':
          await this.handleInvoicePaymentFailed(event.data.object);
          break;

        default:
          this.logger.log(`Unhandled event type: ${event.type}`);
      }

      return { received: true };
    } catch (error) {
      this.logger.error(`Error processing webhook: ${error.message}`);
      throw error;
    }
  }

  private async handleCheckoutSessionCompleted(session: any): Promise<void> {
    this.logger.log(`Checkout session completed: ${session.id}`);
    
    if (session.mode === 'subscription' && session.subscription) {
      // Subscription will be handled by subscription.created webhook
      this.logger.log(`Subscription created from checkout: ${session.subscription}`);
    }
  }

  private async handleInvoicePaymentSucceeded(invoice: any): Promise<void> {
    this.logger.log(`Invoice payment succeeded: ${invoice.id}`);
    // Add any additional logic for successful payments
  }

  private async handleInvoicePaymentFailed(invoice: any): Promise<void> {
    this.logger.log(`Invoice payment failed: ${invoice.id}`);
    // Add logic for handling failed payments (notifications, etc.)
  }
} 