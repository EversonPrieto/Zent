import { Module } from '@nestjs/common';
import { InvitesService } from './invites.service';
import { InvitesController } from './invites.controller';
import { EmailModule } from '../common/email/email.module';

@Module({
  imports: [EmailModule],
  providers: [InvitesService],
  controllers: [InvitesController]
})
export class InvitesModule {}
