import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
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
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';

import { TasksService } from './tasks.service';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { MoveTaskDto } from './dto/move-task.dto';

@ApiTags('Tasks')
@ApiBearerAuth()
@ApiSecurity('workspace-id')
@UseGuards(JwtAuthGuard, WorkspaceGuard, RolesGuard)
@Controller('tasks')
export class TasksController {
  constructor(private service: TasksService) {}

  @ApiOperation({ summary: 'Criar task no workspace atual' })
  @Roles(Role.OWNER, Role.ADMIN, Role.MEMBER)
  @Post()
  create(@Req() req: any, @Body() dto: CreateTaskDto) {
    return this.service.create(req.workspaceId, dto, req.user.sub);
  }

  @ApiOperation({ summary: 'Listar tasks (filtros + paginação)' })
  @Get()
  list(@Req() req: any, @Query() query: any) {
    return this.service.list(req.workspaceId, query);
  }

  @ApiOperation({ summary: 'Buscar task por id' })
  @Get(':id')
  get(@Req() req: any, @Param('id') id: string) {
    return this.service.get(req.workspaceId, id);
  }

  @ApiOperation({
    summary: 'Atualizar task (status, priority, assignee, position...)',
  })
  @Roles(Role.OWNER, Role.ADMIN, Role.MEMBER)
  @Patch(':id')
  update(@Req() req: any, @Param('id') id: string, @Body() dto: UpdateTaskDto) {
    return this.service.update(req.workspaceId, id, dto, req.user.sub);
  }

  @ApiOperation({
    summary: 'Mover task no Kanban (status + ordenação via position)',
  })
  @Roles(Role.OWNER, Role.ADMIN, Role.MEMBER)
  @Patch(':id/move')
  move(@Req() req: any, @Param('id') id: string, @Body() dto: MoveTaskDto) {
    return this.service.move(req.workspaceId, id, dto, req.user.sub);
  }
  @ApiOperation({ summary: 'Remover task' })
  @Roles(Role.OWNER, Role.ADMIN, Role.MEMBER)
  @Delete(':id')
  delete(@Req() req: any, @Param('id') id: string) {
    return this.service.delete(req.workspaceId, id);
  }

  // Labels
  @ApiOperation({ summary: 'Adicionar label à task' })
  @Roles(Role.OWNER, Role.ADMIN, Role.MEMBER)
  @Post(':id/labels/:labelId')
  addLabel(
    @Req() req: any,
    @Param('id') taskId: string,
    @Param('labelId') labelId: string,
  ) {
    return this.service.addLabel(req.workspaceId, taskId, labelId);
  }

  @ApiOperation({ summary: 'Remover label da task' })
  @Roles(Role.OWNER, Role.ADMIN, Role.MEMBER)
  @Delete(':id/labels/:labelId')
  removeLabel(
    @Req() req: any,
    @Param('id') taskId: string,
    @Param('labelId') labelId: string,
  ) {
    return this.service.removeLabel(req.workspaceId, taskId, labelId);
  }

  // Assignees
  @ApiOperation({ summary: 'Adicionar assignee à task' })
  @Roles(Role.OWNER, Role.ADMIN, Role.MEMBER)
  @Post(':id/assignees/:userId')
  addAssignee(
    @Req() req: any,
    @Param('id') taskId: string,
    @Param('userId') userId: string,
  ) {
    return this.service.addAssignee(req.workspaceId, taskId, userId);
  }

  @ApiOperation({ summary: 'Remover assignee da task' })
  @Roles(Role.OWNER, Role.ADMIN, Role.MEMBER)
  @Delete(':id/assignees/:userId')
  removeAssignee(
    @Req() req: any,
    @Param('id') taskId: string,
    @Param('userId') userId: string,
  ) {
    return this.service.removeAssignee(req.workspaceId, taskId, userId);
  }

  // Attachments
  @ApiOperation({ summary: 'Adicionar anexo à task' })
  @Roles(Role.OWNER, Role.ADMIN, Role.MEMBER)
  @Post(':id/attachments')
  addAttachment(
    @Req() req: any,
    @Param('id') taskId: string,
    @Body()
    body: { url: string; fileName: string; fileType: string; size?: number },
  ) {
    return this.service.addAttachment(req.workspaceId, taskId, body);
  }

  @ApiOperation({ summary: 'Remover anexo da task' })
  @Roles(Role.OWNER, Role.ADMIN, Role.MEMBER)
  @Delete(':id/attachments/:attachmentId')
  removeAttachment(
    @Req() req: any,
    @Param('id') taskId: string,
    @Param('attachmentId') attachmentId: string,
  ) {
    return this.service.removeAttachment(req.workspaceId, taskId, attachmentId);
  }
}
