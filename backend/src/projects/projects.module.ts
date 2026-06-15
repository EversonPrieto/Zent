import { Module } from '@nestjs/common';
import { ProjectsController } from './projects.controller';
import { ProjectsService } from './projects.service';
import { ActivityModule } from 'src/activity/activity.module';
import { AclModule } from 'src/common/acl/acl.module';
import { LimitsModule } from 'src/limits/limits.module';

@Module({
  imports: [ActivityModule, AclModule, LimitsModule],
  controllers: [ProjectsController],
  providers: [ProjectsService],
})
export class ProjectsModule {}
