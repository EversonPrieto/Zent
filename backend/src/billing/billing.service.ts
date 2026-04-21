import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Stripe from 'stripe';

@Injectable()
export class BillingService {
  private stripe: any = null;

  constructor(private configService: ConfigService) {}

  private getStripe() {
    if (!this.stripe) {
      const secretKey = this.configService.get<string>('STRIPE_SECRET_KEY');
      if (!secretKey) {
        throw new Error('STRIPE_SECRET_KEY is not configured');
      }
      this.stripe = new Stripe(secretKey);
    }
    return this.stripe;
  }

  async createPaymentIntent(email: string, name: string, amount: number = 2900) {
    try {
      const stripe = this.getStripe();
      const paymentIntent = await stripe.paymentIntents.create({
        amount, 
        currency: 'usd',
        receipt_email: email,
        metadata: {
          customer_name: name,
          customer_email: email,
        },
      });

      return {
        clientSecret: paymentIntent.client_secret,
        paymentIntentId: paymentIntent.id,
      };
    } catch (error) {
      throw new Error(`Failed to create payment intent: ${(error as any).message}`);
    }
  }

  async confirmPaymentIntent(paymentIntentId: string) {
    try {
      const stripe = this.getStripe();
      const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
      return paymentIntent;
    } catch (error) {
      throw new Error(`Failed to retrieve payment intent: ${(error as any).message}`);
    }
  }
}
