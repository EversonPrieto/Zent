import { Body, Controller, Get, Param, Post, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiSecurity, ApiTags } from '@nestjs/swagger';
import { Role } from '@prisma/client';

import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { WorkspaceGuard } from '../workspaces/workspace.guard';

import { Roles } from '../common/decorators/roles.decorator';
import { RolesGuard } from '../common/guards/roles.guard';

import { ProjectsService } from './projects.service';
import { CreateProjectDto } from './dto/create-project.dto';

@ApiTags('Projects')
@ApiBearerAuth()
@ApiSecurity('workspace-id')
@UseGuards(JwtAuthGuard, WorkspaceGuard, RolesGuard)
@Controller('projects')
export class ProjectsController {
  constructor(private service: ProjectsService) {}

  @ApiOperation({ summary: 'Criar um novo projeto' })
  @Roles(Role.OWNER, Role.ADMIN, Role.MEMBER)
  @Post()
  create(@Req() req: any, @Body() dto: CreateProjectDto) {
    return this.service.create(req.workspaceId, dto, req.user.sub);
  }

  @ApiOperation({ summary: 'Listar projetos do workspace atual' })
  @Get()
  list(@Req() req: any) {
    return this.service.list(req.workspaceId);
  }

  @ApiOperation({ summary: 'Buscar projeto por id' })
  @Get(':id')
  get(@Req() req: any, @Param('id') id: string) {
    return this.service.get(req.workspaceId, id);
  }
}