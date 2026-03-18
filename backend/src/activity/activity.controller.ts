import { Controller, Get, Query, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiSecurity, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { WorkspaceGuard } from '../workspaces/workspace.guard';
import { ActivityService } from './activity.service';

@ApiTags('Activity')
@ApiBearerAuth()
@ApiSecurity('workspace-id')
@UseGuards(JwtAuthGuard, WorkspaceGuard)
@Controller('activity')
export class ActivityController {
  constructor(private service: ActivityService) {}

  @Get()
  list(@Req() req: any, @Query('taskId') taskId?: string) {
    return this.service.listByWorkspace(req.workspaceId, taskId);
  }
}