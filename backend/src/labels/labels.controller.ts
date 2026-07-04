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
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';

import { LabelsService } from './labels.service';

@ApiTags('Labels')
@ApiBearerAuth()
@ApiSecurity('workspace-id')
@UseGuards(JwtAuthGuard, WorkspaceGuard, RolesGuard)
@Controller('labels')
export class LabelsController {
  constructor(private labelsService: LabelsService) {}

  @ApiOperation({ summary: 'Listar labels do workspace atual' })
  @Get()
  async getLabels(@Req() req: any) {
    return this.labelsService.getLabels(req.workspaceId);
  }

  @ApiOperation({ summary: 'Criar label no workspace atual' })
  @Roles(Role.OWNER, Role.ADMIN, Role.MEMBER)
  @Post()
  async createLabel(
    @Req() req: any,
    @Body() data: { name: string; color: string },
  ) {
    return this.labelsService.createLabel(
      req.workspaceId,
      data.name,
      data.color,
    );
  }

  @ApiOperation({ summary: 'Atualizar label' })
  @Roles(Role.OWNER, Role.ADMIN, Role.MEMBER)
  @Patch(':id')
  async updateLabel(
    @Req() req: any,
    @Param('id') id: string,
    @Body() data: { name?: string; color?: string },
  ) {
    return this.labelsService.updateLabel(
      id,
      req.workspaceId,
      data,
      req.user.sub,
    );
  }

  @ApiOperation({ summary: 'Deletar label' })
  @Roles(Role.OWNER, Role.ADMIN, Role.MEMBER)
  @Delete(':id')
  async deleteLabel(@Req() req: any, @Param('id') id: string) {
    return this.labelsService.deleteLabel(id, req.workspaceId);
  }
}