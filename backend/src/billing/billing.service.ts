import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import Stripe from 'stripe';

@Injectable()
export class BillingService {
  private stripe: any = null;

  constructor(
    private configService: ConfigService,
    private prisma: PrismaService,
  ) {}

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

  async createPaymentIntent(
    email: string,
    name: string,
    amount: number = 2900,
  ) {
    try {
      const stripe = this.getStripe();
      const paymentIntent = await stripe.paymentIntents.create({
        amount,
        currency: 'brl',
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
      throw new Error(`Failed to create payment intent: ${error.message}`);
    }
  }

  async confirmPaymentIntent(paymentIntentId: string, userId: string) {
    try {
      console.log(
        `[BillingService] Confirming payment intent: ${paymentIntentId} for user: ${userId}`,
      );

      const stripe = this.getStripe();
      const paymentIntent =
        await stripe.paymentIntents.retrieve(paymentIntentId);

      console.log(
        `[BillingService] PaymentIntent status: ${paymentIntent.status}`,
      );

      if (paymentIntent.status === 'succeeded') {
        // Calculate subscription end date (30 days from now)
        const subscriptionEndsAt = new Date();
        subscriptionEndsAt.setDate(subscriptionEndsAt.getDate() + 30);

        console.log(
          `[BillingService] Subscription ends at: ${subscriptionEndsAt.toISOString()}`,
        );

        // Update user with Pro plan and subscription info
        const updateData: any = {
          plan: 'pro',
          stripeSubscriptionId: paymentIntentId,
          subscriptionEndsAt: subscriptionEndsAt,
        };

        // Only set stripeCustomerId if it exists
        if (paymentIntent.customer) {
          console.log(
            `[BillingService] Setting stripeCustomerId: ${paymentIntent.customer}`,
          );
          updateData.stripeCustomerId = paymentIntent.customer;
        }

        console.log(`[BillingService] Updating user with data:`, updateData);

        const updatedUser = await this.prisma.user.update({
          where: { id: userId },
          data: updateData,
        });

        console.log(`[BillingService] User successfully updated:`, updatedUser);

        const { password, ...result } = updatedUser;
        return result;
      }

      throw new Error(
        `Payment intent status is ${paymentIntent.status}, expected succeeded`,
      );
    } catch (error) {
      console.error('[BillingService] confirmPaymentIntent error:', error);
      throw error;
    }
  }

  async cancelSubscription(userId: string) {
    try {
      // Reset user subscription data
      const updatedUser = await this.prisma.user.update({
        where: { id: userId },
        data: {
          plan: 'free',
          stripeCustomerId: null,
          stripeSubscriptionId: null,
          subscriptionEndsAt: null,
        },
      });

      const { password, ...result } = updatedUser;
      return result;
    } catch (error) {
      throw new Error(`Failed to cancel subscription: ${error.message}`);
    }
  }
}
