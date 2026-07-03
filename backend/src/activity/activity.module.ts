import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';

import { ActivityService } from './activity.service';
import { ActivityController } from './activity.controller';
import { ActivityGateway } from './activity.gateway';
import { PresenceGateway } from './presence.gateway';

@Module({
  imports: [
    JwtModule.register({
      secret: process.env.JWT_SECRET,
    }),
  ],
  providers: [ActivityService, ActivityGateway, PresenceGateway],
  controllers: [ActivityController],
  exports: [ActivityService],
})
export class ActivityModule {}
