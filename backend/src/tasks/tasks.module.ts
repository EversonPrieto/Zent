import { Module } from '@nestjs/common';
import { TasksController } from './tasks.controller';
import { TasksService } from './tasks.service';
import { TasksGateway } from './tasks.gateway';
import { ActivityModule } from 'src/activity/activity.module';
import { AclModule } from 'src/common/acl/acl.module';

@Module({
  imports: [ActivityModule, AclModule],
  controllers: [TasksController],
  providers: [TasksService, TasksGateway],
})
export class TasksModule {}