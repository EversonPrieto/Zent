import { Module } from '@nestjs/common';

import { InvitesService } from './invites.service';
import { InvitesController } from './invites.controller';

import { EmailModule } from '../common/email/email.module';
import { LimitsModule } from '../limits/limits.module';
import { AclModule } from '../common/acl/acl.module';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule, EmailModule, LimitsModule, AclModule],
  providers: [InvitesService],
  controllers: [InvitesController],
})
export class InvitesModule {}