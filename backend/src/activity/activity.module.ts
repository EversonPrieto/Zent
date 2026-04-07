import { Module } from '@nestjs/common';
import { ActivityService } from './activity.service';
import { ActivityController } from './activity.controller';
import { ActivityGateway } from './activity.gateway';
import { PresenceGateway } from './presence.gateway';

@Module({
  providers: [ActivityService, ActivityGateway, PresenceGateway],
  controllers: [ActivityController],
  exports: [ActivityService],
})
export class ActivityModule {}