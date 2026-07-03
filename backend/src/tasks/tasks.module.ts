import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { TasksController } from './tasks.controller';
import { TasksService } from './tasks.service';
import { TasksGateway } from './tasks.gateway';
import { ActivityModule } from 'src/activity/activity.module';
import { AclModule } from 'src/common/acl/acl.module';
import { LimitsModule } from 'src/limits/limits.module';
import { EmailTaskMovedModule } from 'src/notifications/email-task-moved/email-task-moved.module';

@Module({
  imports: [
    ActivityModule,
    AclModule,
    LimitsModule,
    EmailTaskMovedModule,
    // Required for TasksGateway to inject JwtService (used to validate socket handshake)
    // Must use the same JWT secret as AuthModule for verifying socket tokens.
    JwtModule.register({
      secret: process.env.JWT_SECRET,
    }),
  ],
  controllers: [TasksController],
  providers: [TasksService, TasksGateway],
  exports: [TasksGateway],
})
export class TasksModule {}
