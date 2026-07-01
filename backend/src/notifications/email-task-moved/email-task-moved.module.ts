import { Module } from '@nestjs/common';
import { EmailModule } from 'src/common/email/email.module';
import { PrismaModule } from 'src/prisma/prisma.module';
import { EmailTaskMovedDigestService } from './email-task-moved-digest.service';
import { EmailTaskMovedDigestWorker } from './email-task-moved-digest.worker';

@Module({
  imports: [EmailModule, PrismaModule],
  providers: [EmailTaskMovedDigestService, EmailTaskMovedDigestWorker],
  exports: [EmailTaskMovedDigestService],
})
export class EmailTaskMovedModule {}
