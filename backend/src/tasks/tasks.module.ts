import { Module } from '@nestjs/common';
import { TasksController } from './tasks.controller';
import { TasksService } from './tasks.service';
import { ActivityModule } from 'src/activity/activity.module';
import { AclModule } from 'src/common/acl/acl.module';

@Module({
  imports: [ActivityModule, AclModule],
  controllers: [TasksController],
  providers: [TasksService],
})
export class TasksModule {}