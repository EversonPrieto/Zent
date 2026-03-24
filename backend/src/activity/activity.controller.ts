import { Controller, Get, Query, Headers } from '@nestjs/common';
import { ActivityService } from './activity.service';

@Controller('activities')
export class ActivityController {
  constructor(private activity: ActivityService) {}

  @Get()
  list(
    @Headers('x-workspace-id') workspaceId: string,
    @Query('projectId') projectId?: string,
  ) {
    return this.activity.listByWorkspace(workspaceId, projectId);
  }
}