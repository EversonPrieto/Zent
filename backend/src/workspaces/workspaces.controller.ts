import {
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
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { WorkspacesService } from './workspaces.service';
import { CreateWorkspaceDto } from './dto/create-workspace.dto';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { InviteMemberDto } from './dto/invite-member.dto';
import { UpdateMemberRoleDto } from './dto/update-member-role.dto';

@ApiTags('Workspaces')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('workspaces')
export class WorkspacesController {
  constructor(private service: WorkspacesService) { }

  @Post()
  create(@Req() req: any, @Body() dto: CreateWorkspaceDto) {
    try {
      return this.service.create(req.user.sub, dto);
    } catch (error) {
      console.error('[WorkspacesController] Error creating workspace:', error);
      throw error;
    }
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

  @Post('members')
  inviteMember(
    @Req() req: any,
    @Headers('x-workspace-id') workspaceId: string,
    @Body() dto: InviteMemberDto,
  ) {
    return this.service.inviteMember(
      workspaceId,
      req.user.sub,
      dto.email,
      dto.role,
    );
  }

  @Get('members')
  listMembers(
    @Req() req: any,
    @Headers('x-workspace-id') workspaceId: string,
  ) {
    return this.service.listMembers(workspaceId, req.user.sub);
  }
  @Patch('members/:memberId')
  updateMemberRole(
    @Req() req: any,
    @Headers('x-workspace-id') workspaceId: string,
    @Param('memberId') memberId: string,
    @Body() dto: UpdateMemberRoleDto,
  ) {
    return this.service.updateMemberRole(
      workspaceId,
      req.user.sub,
      memberId,
      dto.role,
    );
  }

  @Delete('members/:memberId')
  removeMember(
    @Req() req: any,
    @Headers('x-workspace-id') workspaceId: string,
    @Param('memberId') memberId: string,
  ) {
    return this.service.removeMember(
      workspaceId,
      req.user.sub,
      memberId,
    );
  }

  @Get('permissions/:workspaceId')
  getPermissions(
    @Req() req: any,
    @Param('workspaceId') workspaceId: string,
  ) {
    return this.service.getUserPermissions(workspaceId, req.user.sub);
  }

  @Post('current/logo')
  @UseInterceptors(FileInterceptor('file'))
  uploadLogo(
    @Req() req: any,
    @Headers('x-workspace-id') workspaceId: string,
    @UploadedFile() file: Express.Multer.File,
  ) {
    return this.service.updateLogo(workspaceId, req.user.sub, file);
  }

  @Delete(':workspaceId')
  deleteWorkspace(
    @Req() req: any,
    @Param('workspaceId') workspaceId: string,
  ) {
    return this.service.delete(workspaceId, req.user.sub);
  }
}