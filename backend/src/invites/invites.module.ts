import { Module } from '@nestjs/common';
import { InvitesService } from './invites.service';
import { InvitesController } from './invites.controller';
import { EmailModule } from '../common/email/email.module';
import { LimitsModule } from '../limits/limits.module';

@Module({
  imports: [EmailModule, LimitsModule],
  providers: [InvitesService],
  controllers: [InvitesController],
})
export class InvitesModule {}
