import { Controller, Post, Body, UseGuards, Request, BadRequestException, InternalServerErrorException } from '@nestjs/common';
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
    @Request() req: any,
    @Body() body: { paymentIntentId: string },
  ) {
    try {
      const { paymentIntentId } = body;
      const userId = req.user.sub || req.user.id;
      
      if (!paymentIntentId) {
        throw new BadRequestException('paymentIntentId is required');
      }
      
      const result = await this.billingService.confirmPaymentIntent(paymentIntentId, userId);
      return result;
    } catch (error) {
      console.error('[BillingController] confirmPaymentIntent error:', error);
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new InternalServerErrorException(`Payment confirmation failed: ${(error as any).message}`);
    }
  }

  @Post('cancel-subscription')
  @UseGuards(JwtAuthGuard)
  async cancelSubscription(@Request() req: any) {
    const userId = req.user.id;
    const result = await this.billingService.cancelSubscription(userId);
    return result;
  }
}
