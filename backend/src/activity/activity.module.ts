import { Module } from '@nestjs/common';
import { ActivityService } from './activity.service';
import { ActivityController } from './activity.controller';
import { ActivityGateway } from './activity.gateway';

@Module({
  providers: [ActivityService, ActivityGateway],
  controllers: [ActivityController],
  exports: [ActivityService],
})
export class ActivityModule {}