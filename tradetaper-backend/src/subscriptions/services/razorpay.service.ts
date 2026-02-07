import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Razorpay from 'razorpay';
import * as crypto from 'crypto';

@Injectable()
export class RazorpayService {
  private razorpay: any;
  private readonly logger = new Logger(RazorpayService.name);

  constructor(private configService: ConfigService) {
    const keyId = this.configService.get<string>('RAZORPAY_KEY_ID');
    const keySecret = this.configService.get<string>('RAZORPAY_KEY_SECRET');
    console.log('[RazorpayService] Initializing with Key ID:', keyId ? '***' + keyId.slice(-4) : 'undefined');

    if (keyId && keySecret) {
      this.razorpay = new Razorpay({
        key_id: keyId,
        key_secret: keySecret,
      });
    } else {
      this.logger.warn('RAZORPAY_KEY_ID or RAZORPAY_KEY_SECRET not set');
    }
  }

  async createCustomer(email: string, name: string, contact?: string) {
    if (!this.razorpay) throw new Error('Razorpay client not initialized');
    try {
      // First try to find existing customer by email logic if you stored it?
      // Razorpay doesn't strictly enforce unique emails, so we create one and store the ID.
      const customer = await this.razorpay.customers.create({
        email,
        name,
        contact,
        fail_existing: 0, // don't fail if exists (though 'fail_existing' param logic depends on api version)
      });
      return customer;
    } catch (error) {
      this.logger.error('Error creating Razorpay customer', error);
      throw error;
    }
  }

  async createSubscription(
    planId: string,
    totalCount: number = 60, // 5 years by default (Razorpay max is 100)
    quantity: number = 1,
    startAt?: number,
    expireBy?: number,
    notes?: any,
    offerId?: string,
  ) {
    if (!this.razorpay) throw new Error('Razorpay client not initialized');
    try {
      const payload: any = {
        plan_id: planId,
        total_count: totalCount,
        quantity,
        customer_notify: 1,
        start_at: startAt,
        expire_by: expireBy,
        notes,
      };

      if (offerId) {
          payload.offer_id = offerId;
      }

      const subscription = await this.razorpay.subscriptions.create(payload);
      return subscription;
    } catch (error) {
      this.logger.error('Error creating subscription', error);
      throw error;
    }
  }

  async fetchSubscription(subscriptionId: string) {
    if (!this.razorpay) throw new Error('Razorpay client not initialized');
    return this.razorpay.subscriptions.fetch(subscriptionId);
  }

  async fetchInvoices(customerId: string) {
    if (!this.razorpay) throw new Error('Razorpay client not initialized');
    return this.razorpay.invoices.all({ customer_id: customerId });
  }

  verifyWebhookSignature(body: string, signature: string, secret: string): boolean {
    const expectedSignature = crypto
      .createHmac('sha256', secret)
      .update(body)
      .digest('hex');
    
    return expectedSignature === signature;
  }
  
  getClient() {
      return this.razorpay;
  }
}
