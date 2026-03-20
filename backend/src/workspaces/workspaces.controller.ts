import {
  Body,
  Controller,
  Get,
  Patch,
  Post,
  Req,
  UseGuards,
  Headers,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { WorkspacesService } from './workspaces.service';
import { CreateWorkspaceDto } from './dto/create-workspace.dto';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';

@ApiTags('Workspaces')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('workspaces')
export class WorkspacesController {
  constructor(private service: WorkspacesService) { }

  @Post()
  create(@Req() req: any, @Body() dto: CreateWorkspaceDto) {
    return this.service.create(req.user.sub, dto);
  }

  @Get()
  list(@Req() req: any) {
    return this.service.listForUser(req.user.sub);
  }

  @Get('current')
  current(
    @Req() req: any,
    @Headers('x-workspace-id') workspaceId: string,
  ) {
    return this.service.current(req.user.sub, workspaceId);
  }

  @Patch('current')
  updateCurrent(
    @Req() req: any,
    @Headers('x-workspace-id') workspaceId: string,
    @Body('name') name: string,
  ) {
    return this.service.update(workspaceId, req.user.sub, name);
  }
}