import { Body, Controller, Get, Param, Patch, Post, Query, Req, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { WorkspaceGuard } from 'src/workspaces/workspace.guard';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { TasksService } from './tasks.service';

@UseGuards(JwtAuthGuard, WorkspaceGuard)
@Controller('tasks')
export class TasksController {
  constructor(private service: TasksService) {}

  @Post()
  create(@Req() req: any, @Body() dto: CreateTaskDto) {
    return this.service.create(req.workspaceId, dto);
  }

  @Get()
  list(@Req() req: any, @Query() query: any) {
    return this.service.list(req.workspaceId, query);
  }

  @Get(':id')
  get(@Req() req: any, @Param('id') id: string) {
    return this.service.get(req.workspaceId, id);
  }

  @Patch(':id')
  update(@Req() req: any, @Param('id') id: string, @Body() dto: UpdateTaskDto) {
    return this.service.update(req.workspaceId, id, dto);
  }
}