import { Module } from '@nestjs/common';
import { TasksController } from './tasks.controller';
import { TasksService } from './tasks.service';
import { TasksGateway } from './tasks.gateway';
import { ActivityModule } from 'src/activity/activity.module';
import { AclModule } from 'src/common/acl/acl.module';
import { LimitsModule } from 'src/limits/limits.module';
import { EmailTaskMovedModule } from 'src/notifications/email-task-moved/email-task-moved.module';

@Module({
  imports: [ActivityModule, AclModule, LimitsModule, EmailTaskMovedModule],
  controllers: [TasksController],
  providers: [TasksService, TasksGateway],
  exports: [TasksGateway],
})
export class TasksModule {}
