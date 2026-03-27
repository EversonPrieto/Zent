import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  Req,
  UseGuards,
} from '@nestjs/common'
import { InvitesService } from './invites.service'
import { CreateInviteDto } from './dto/create-invite.dto'
import { JwtAuthGuard } from '../auth/jwt-auth.guard'

@Controller('invites')
export class InvitesController {
  constructor(private readonly invitesService: InvitesService) {}

  @UseGuards(JwtAuthGuard)
  @Post()
  create(@Body() body: CreateInviteDto, @Req() req) {
    return this.invitesService.createInvite(
      body.email,
      body.workspaceId,
      req.user.sub,
    )
  }

  @Get(':token')
  getInvite(@Param('token') token: string) {
    return this.invitesService.getInviteByToken(token)
  }

  @UseGuards(JwtAuthGuard)
  @Post(':token/accept')
  accept(@Param('token') token: string, @Req() req) {
    return this.invitesService.acceptInvite(token, req.user.sub)
  }

  @UseGuards(JwtAuthGuard)
  @Post(':token/decline')
  decline(@Param('token') token: string, @Req() req) {
    return this.invitesService.declineInvite(token, req.user.sub)
  }
}