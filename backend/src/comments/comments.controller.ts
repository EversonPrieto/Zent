import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { WorkspaceGuard } from 'src/workspaces/workspace.guard';
import { CommentsService } from './comments.service';
import { CreateCommentDto } from './dto/create-comment.dto';
import { ApiBearerAuth, ApiSecurity, ApiTags } from '@nestjs/swagger';

@ApiTags('Comments')
@ApiBearerAuth()
@ApiSecurity('workspace-id')
@UseGuards(JwtAuthGuard, WorkspaceGuard)
@Controller()
export class CommentsController {
  constructor(private service: CommentsService) {}

  @Post('tasks/:taskId/comments')
  create(
    @Req() req: any,
    @Param('taskId') taskId: string,
    @Body() dto: CreateCommentDto,
  ) {
    return this.service.create(req.workspaceId, req.user.sub, taskId, dto);
  }

  @Get('tasks/:taskId/comments')
  list(@Req() req: any, @Param('taskId') taskId: string) {
    return this.service.list(req.workspaceId, taskId);
  }

  @Delete('comments/:id')
  delete(@Req() req: any, @Param('id') id: string) {
    return this.service.delete(req.workspaceId, id, req.user.sub);
  }
}
