import 'multer';
import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Headers,
  Param,
  Patch,
  Post,
  Req,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiSecurity,
  ApiTags,
} from '@nestjs/swagger';

import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { WorkspacesService } from './workspaces.service';
import { CreateWorkspaceDto } from './dto/create-workspace.dto';
import { InviteMemberDto } from './dto/invite-member.dto';
import { UpdateMemberRoleDto } from './dto/update-member-role.dto';

@ApiTags('Workspaces')
@ApiBearerAuth()
@ApiSecurity('workspace-id')
@UseGuards(JwtAuthGuard)
@Controller('workspaces')
export class WorkspacesController {
  constructor(private service: WorkspacesService) {}

  private getRequiredWorkspaceId(workspaceId?: string) {
    const cleanWorkspaceId = workspaceId?.trim();

    if (!cleanWorkspaceId) {
      throw new BadRequestException('Workspace ID é obrigatório.');
    }

    return cleanWorkspaceId;
  }

  @ApiOperation({ summary: 'Criar workspace' })
  @Post()
  create(@Req() req: any, @Body() dto: CreateWorkspaceDto) {
    return this.service.create(req.user.sub, dto);
  }

  @ApiOperation({ summary: 'Listar workspaces do usuário' })
  @Get()
  list(@Req() req: any) {
    return this.service.listForUser(req.user.sub);
  }

  @ApiOperation({ summary: 'Buscar workspace atual' })
  @Get('current')
  current(@Req() req: any, @Headers('x-workspace-id') workspaceId: string) {
    return this.service.current(
      req.user.sub,
      this.getRequiredWorkspaceId(workspaceId),
    );
  }

  @ApiOperation({ summary: 'Atualizar workspace atual' })
  @Patch('current')
  updateCurrent(
    @Req() req: any,
    @Headers('x-workspace-id') workspaceId: string,
    @Body('name') name: string,
  ) {
    return this.service.update(
      this.getRequiredWorkspaceId(workspaceId),
      req.user.sub,
      name,
    );
  }

  @ApiOperation({ summary: 'Convidar membro para workspace atual' })
  @Post('members')
  inviteMember(
    @Req() req: any,
    @Headers('x-workspace-id') workspaceId: string,
    @Body() dto: InviteMemberDto,
  ) {
    return this.service.inviteMember(
      this.getRequiredWorkspaceId(workspaceId),
      req.user.sub,
      dto.email,
      dto.role,
    );
  }

  @ApiOperation({ summary: 'Listar membros do workspace atual' })
  @Get('members')
  listMembers(@Req() req: any, @Headers('x-workspace-id') workspaceId: string) {
    return this.service.listMembers(
      this.getRequiredWorkspaceId(workspaceId),
      req.user.sub,
    );
  }

  @ApiOperation({ summary: 'Atualizar role de membro' })
  @Patch('members/:memberId')
  updateMemberRole(
    @Req() req: any,
    @Headers('x-workspace-id') workspaceId: string,
    @Param('memberId') memberId: string,
    @Body() dto: UpdateMemberRoleDto,
  ) {
    return this.service.updateMemberRole(
      this.getRequiredWorkspaceId(workspaceId),
      req.user.sub,
      memberId,
      dto.role,
    );
  }

  @ApiOperation({ summary: 'Remover membro do workspace' })
  @Delete('members/:memberId')
  removeMember(
    @Req() req: any,
    @Headers('x-workspace-id') workspaceId: string,
    @Param('memberId') memberId: string,
  ) {
    return this.service.removeMember(
      this.getRequiredWorkspaceId(workspaceId),
      req.user.sub,
      memberId,
    );
  }

  @ApiOperation({ summary: 'Buscar permissões do usuário no workspace' })
  @Get('permissions/:workspaceId')
  getPermissions(@Req() req: any, @Param('workspaceId') workspaceId: string) {
    return this.service.getUserPermissions(
      this.getRequiredWorkspaceId(workspaceId),
      req.user.sub,
    );
  }

  @ApiOperation({ summary: 'Atualizar logo do workspace atual' })
  @Post('current/logo')
  @UseInterceptors(FileInterceptor('file'))
  uploadLogo(
    @Req() req: any,
    @Headers('x-workspace-id') workspaceId: string,
    @UploadedFile() file: Express.Multer.File,
  ) {
    return this.service.updateLogo(
      this.getRequiredWorkspaceId(workspaceId),
      req.user.sub,
      file,
    );
  }

  @ApiOperation({ summary: 'Deletar workspace' })
  @Delete(':workspaceId')
  deleteWorkspace(@Req() req: any, @Param('workspaceId') workspaceId: string) {
    return this.service.delete(
      this.getRequiredWorkspaceId(workspaceId),
      req.user.sub,
    );
  }
}