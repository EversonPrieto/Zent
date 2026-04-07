import { Controller, Get, Post, Patch, Delete, Body, Param, Headers, UseGuards, BadRequestException } from '@nestjs/common';
import { LabelsService } from './labels.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('labels')
@UseGuards(JwtAuthGuard)
export class LabelsController {
  constructor(private labelsService: LabelsService) {}

  @Get()
  async getLabels(@Headers('x-workspace-id') workspaceId: string) {
    if (!workspaceId) {
      throw new BadRequestException('Workspace ID é obrigatório');
    }
    return this.labelsService.getLabels(workspaceId);
  }

  @Post()
  async createLabel(
    @Headers('x-workspace-id') workspaceId: string,
    @Body() data: { name: string; color: string },
  ) {
    if (!workspaceId) {
      throw new BadRequestException('Workspace ID é obrigatório');
    }
    return this.labelsService.createLabel(workspaceId, data.name, data.color);
  }

  @Patch(':id')
  async updateLabel(
    @Param('id') id: string,
    @Headers('x-workspace-id') workspaceId: string,
    @Body() data: { name?: string; color?: string },
  ) {
    if (!workspaceId) {
      throw new BadRequestException('Workspace ID é obrigatório');
    }
    return this.labelsService.updateLabel(id, workspaceId, data);
  }

  @Delete(':id')
  async deleteLabel(
    @Param('id') id: string,
    @Headers('x-workspace-id') workspaceId: string,
  ) {
    if (!workspaceId) {
      throw new BadRequestException('Workspace ID é obrigatório');
    }
    return this.labelsService.deleteLabel(id, workspaceId);
  }
}
