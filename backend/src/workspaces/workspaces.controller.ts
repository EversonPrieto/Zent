import {
    Body,
    Controller,
    Get,
    Post,
    Req,
    UseGuards,
    Headers,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { WorkspacesService } from './workspaces.service';
import { CreateWorkspaceDto } from './dto/create-workspace.dto';


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
}