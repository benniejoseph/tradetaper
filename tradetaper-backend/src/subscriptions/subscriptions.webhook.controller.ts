import {
  Controller,
  Post,
  Headers,
  BadRequestException,
  HttpCode,
  HttpStatus,
  Req,
  RawBodyRequest,
} from '@nestjs/common';
import { Request } from 'express';
import { SubscriptionService } from './services/subscription.service';
import { RazorpayService } from './services/razorpay.service';
import { ConfigService } from '@nestjs/config';

@Controller('subscriptions')
export class SubscriptionsWebhookController {
  constructor(
    private readonly subscriptionService: SubscriptionService,
    private readonly razorpayService: RazorpayService,
    private readonly configService: ConfigService,
  ) {}

  @Post('webhook/razorpay')
  @HttpCode(HttpStatus.OK)
  async handleRazorpayWebhook(
    @Req() req: RawBodyRequest<Request>,
    @Headers('x-razorpay-signature') signature: string,
  ) {
    const webhookSecret = this.configService.get<string>(
      'RAZORPAY_WEBHOOK_SECRET',
    );
    if (!webhookSecret) {
      throw new BadRequestException('Webhook secret not configured');
    }

    if (!signature) {
      throw new BadRequestException('Missing signature');
    }

    // Verify Signature using exact raw body bytes instead of JSON.stringify to prevent
    // signature mismatches due to whitespace differences.
    const rawBody = req.rawBody?.toString('utf8');
    if (!rawBody) {
      throw new BadRequestException('Empty body');
    }

    const isValid = this.razorpayService.verifyWebhookSignature(
      rawBody,
      signature,
      webhookSecret,
    );

    if (!isValid) {
      throw new BadRequestException('Invalid signature');
    }

    // Proceeding to handle logic
    const payload = req.body;
    await this.subscriptionService.handleRazorpayWebhook(payload);
    return { status: 'ok' };
  }
}
