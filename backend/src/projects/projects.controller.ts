import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiSecurity,
  ApiTags,
} from '@nestjs/swagger';
import { Role } from '@prisma/client';

import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { WorkspaceGuard } from '../workspaces/workspace.guard';

import { Roles } from '../common/decorators/roles.decorator';
import { RolesGuard } from '../common/guards/roles.guard';

import { ProjectsService } from './projects.service';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';

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

  @ApiOperation({ summary: 'Atualizar projeto' })
  @Roles(Role.OWNER, Role.ADMIN)
  @Patch(':id')
  update(
    @Req() req: any,
    @Param('id') id: string,
    @Body() dto: UpdateProjectDto,
  ) {
    return this.service.update(req.workspaceId, id, dto, req.user.sub);
  }

  @ApiOperation({ summary: 'Deletar projeto' })
  @Roles(Role.OWNER, Role.ADMIN)
  @Delete(':id')
  deleteProject(@Req() req: any, @Param('id') id: string) {
    return this.service.delete(req.workspaceId, id, req.user.sub);
  }
}
