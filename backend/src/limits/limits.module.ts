import { Module } from '@nestjs/common';
import { LimitsService } from './limits.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  providers: [LimitsService],
  exports: [LimitsService],
})
export class LimitsModule {}
