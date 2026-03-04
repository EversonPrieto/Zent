import { Body, Controller, Get, Param, Post, Req, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { WorkspaceGuard } from 'src/workspaces/workspace.guard';
import { ProjectsService } from './projects.service';
import { CreateProjectDto } from './dto/create-project.dto';
import { ApiTags, ApiBearerAuth, ApiSecurity } from '@nestjs/swagger';

@ApiTags('Projects')
@ApiBearerAuth()
@ApiSecurity('workspace-id')
@UseGuards(JwtAuthGuard, WorkspaceGuard)
@Controller('projects')
export class ProjectsController {
  constructor(private service: ProjectsService) {}

  @Post()
  create(@Req() req: any, @Body() dto: CreateProjectDto) {
    return this.service.create(req.workspaceId, dto);
  }

  @Get()
  list(@Req() req: any) {
    return this.service.list(req.workspaceId);
  }

  @Get(':id')
  get(@Req() req: any, @Param('id') id: string) {
    return this.service.get(req.workspaceId, id);
  }
}