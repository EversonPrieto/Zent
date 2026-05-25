import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service'
import { randomUUID } from 'crypto'
import { EmailService } from '../common/email/email.service'
import { LimitsService } from '../limits/limits.service'

@Injectable()
export class InvitesService {
  constructor(
    private prisma: PrismaService,
    private emailService: EmailService,
    private limits: LimitsService,
  ) {}

  async createInvite(email: string, workspaceId: string, userId: string) {
    // Check team member limit
    await this.limits.checkTeamMemberLimit(userId, workspaceId);

    const existingInvite = await this.prisma.workspaceInvite.findFirst({
      where: {
        email,
        workspaceId,
        status: 'PENDING',
      },
    })

    if (existingInvite) {
      throw new BadRequestException(
        'Já existe um convite pendente para esse email',
      )
    }

    const token = randomUUID()

    const invite = await this.prisma.workspaceInvite.create({
      data: {
        email,
        token,
        workspaceId,
        invitedById: userId,
        expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24),
      },
      include: {
        workspace: true,
        invitedBy: true,
      },
    })

  const inviteLink = `${process.env.FRONTEND_URL}/invite/${token}`

    await this.emailService.sendInviteEmail({
      to: email,
      workspaceName: invite.workspace.name,
      invitedByName: invite.invitedBy.name,
      inviteLink,
    })

    return invite
  }

  async getInviteByToken(token: string) {
    const invite = await this.prisma.workspaceInvite.findUnique({
      where: { token },
      include: {
        workspace: true,
        invitedBy: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    })

    if (!invite) {
      throw new NotFoundException('Convite não encontrado')
    }

    if (invite.status !== 'PENDING') {
      throw new BadRequestException('Convite já utilizado')
    }

    if (new Date() > invite.expiresAt) {
      await this.prisma.workspaceInvite.update({
        where: { id: invite.id },
        data: { status: 'EXPIRED' },
      })

      throw new BadRequestException('Convite expirado')
    }

    return invite
  }

  async acceptInvite(token: string, userId: string) {
    const invite = await this.getInviteByToken(token)

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    })

    if (!user) {
      throw new NotFoundException('Usuário não encontrado')
    }

    if (user.email !== invite.email) {
      throw new BadRequestException(
        'Este convite foi enviado para outro email',
      )
    }

    const existingMember = await this.prisma.workspaceMember.findUnique({
      where: {
        workspaceId_userId: {
          workspaceId: invite.workspaceId,
          userId,
        },
      },
    })

    if (!existingMember) {
      await this.prisma.workspaceMember.create({
        data: {
          userId,
          workspaceId: invite.workspaceId,
          role: 'MEMBER',
        },
      })
    }

    await this.prisma.workspaceInvite.update({
      where: { id: invite.id },
      data: { status: 'ACCEPTED' },
    })

    return {
      message: 'Convite aceito com sucesso',
    }
  }

  async declineInvite(token: string, userId: string) {
    const invite = await this.getInviteByToken(token)

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    })

    if (!user) {
      throw new NotFoundException('Usuário não encontrado')
    }

    if (user.email !== invite.email) {
      throw new BadRequestException(
        'Este convite foi enviado para outro email',
      )
    }

    if (invite.status !== 'PENDING') {
      throw new BadRequestException('Convite já utilizado')
    }

    await this.prisma.workspaceInvite.update({
      where: { id: invite.id },
      data: { status: 'REJECTED' },
    })

    return {
      message: 'Convite recusado com sucesso',
    }
  }
}