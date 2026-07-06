import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';

import { InvitesService } from './invites.service';
import { CreateInviteDto } from './dto/create-invite.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@ApiTags('Invites')
@Controller('invites')
export class InvitesController {
  constructor(private readonly invitesService: InvitesService) {}

  @ApiOperation({ summary: 'Criar convite para workspace' })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Post()
  create(@Body() body: CreateInviteDto, @Req() req: any) {
    return this.invitesService.createInvite(
      body.email,
      body.workspaceId,
      req.user.sub,
    );
  }

  @ApiOperation({ summary: 'Buscar convite por token' })
  @Get(':token')
  getInvite(@Param('token') token: string) {
    return this.invitesService.getInviteByToken(token);
  }

  @ApiOperation({ summary: 'Aceitar convite' })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Post(':token/accept')
  accept(@Param('token') token: string, @Req() req: any) {
    return this.invitesService.acceptInvite(token, req.user.sub);
  }

  @ApiOperation({ summary: 'Recusar convite' })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Post(':token/decline')
  decline(@Param('token') token: string, @Req() req: any) {
    return this.invitesService.declineInvite(token, req.user.sub);
  }
}