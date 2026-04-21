import { Controller, Post, Body, UseGuards } from '@nestjs/common';
import { BillingService } from './billing.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('billing')
export class BillingController {
  constructor(private billingService: BillingService) {}

  @Post('create-intent')
  @UseGuards(JwtAuthGuard)
  async createPaymentIntent(
    @Body() body: { email: string; name: string; amount?: number },
  ) {
    const { email, name, amount } = body;
    const result = await this.billingService.createPaymentIntent(email, name, amount);
    return result;
  }

  @Post('confirm-intent')
  @UseGuards(JwtAuthGuard)
  async confirmPaymentIntent(
    @Body() body: { paymentIntentId: string },
  ) {
    const { paymentIntentId } = body;
    const result = await this.billingService.confirmPaymentIntent(paymentIntentId);
    return result;
  }
}
