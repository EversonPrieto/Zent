import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { randomUUID } from 'crypto';

import { PrismaService } from '../prisma/prisma.service';
import { EmailService } from '../common/email/email.service';
import { LimitsService } from '../limits/limits.service';
import { AclService } from '../common/acl/acl.service';

@Injectable()
export class InvitesService {
  constructor(
    private prisma: PrismaService,
    private emailService: EmailService,
    private limits: LimitsService,
    private acl: AclService,
  ) {}

  private normalizeEmail(email: string) {
    const cleanEmail = email?.trim().toLowerCase();

    if (!cleanEmail) {
      throw new BadRequestException('Email é obrigatório.');
    }

    return cleanEmail;
  }

  private async getValidPendingInvite(token: string) {
    if (!token?.trim()) {
      throw new BadRequestException('Token do convite é obrigatório.');
    }

    const invite = await this.prisma.workspaceInvite.findUnique({
      where: {
        token: token.trim(),
      },
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
    });

    if (!invite) {
      throw new NotFoundException('Convite não encontrado.');
    }

    if (invite.status !== 'PENDING') {
      throw new BadRequestException('Convite já utilizado.');
    }

    if (new Date() > invite.expiresAt) {
      await this.prisma.workspaceInvite.update({
        where: { id: invite.id },
        data: { status: 'EXPIRED' },
      });

      throw new BadRequestException('Convite expirado.');
    }

    return invite;
  }

  async createInvite(email: string, workspaceId: string, inviterUserId: string) {
    const cleanEmail = this.normalizeEmail(email);
    const cleanWorkspaceId = workspaceId?.trim();

    if (!cleanWorkspaceId) {
      throw new BadRequestException('Workspace ID é obrigatório.');
    }

    await this.acl.requirePermission(
      'workspace:invite',
      cleanWorkspaceId,
      inviterUserId,
    );

    await this.limits.checkTeamMemberLimit(inviterUserId, cleanWorkspaceId);

    const workspace = await this.prisma.workspace.findUnique({
      where: { id: cleanWorkspaceId },
      select: { id: true, name: true },
    });

    if (!workspace) {
      throw new NotFoundException('Workspace não encontrado.');
    }

    const user = await this.prisma.user.findUnique({
      where: { email: cleanEmail },
      select: { id: true, email: true },
    });

    if (user) {
      const existingMember = await this.prisma.workspaceMember.findUnique({
        where: {
          workspaceId_userId: {
            workspaceId: cleanWorkspaceId,
            userId: user.id,
          },
        },
      });

      if (existingMember) {
        throw new ConflictException('Esse usuário já faz parte do workspace.');
      }
    }

    const existingInvite = await this.prisma.workspaceInvite.findFirst({
      where: {
        email: cleanEmail,
        workspaceId: cleanWorkspaceId,
        status: 'PENDING',
      },
    });

    if (existingInvite) {
      throw new ConflictException(
        'Já existe um convite pendente para esse email.',
      );
    }

    const token = randomUUID();

    const invite = await this.prisma.workspaceInvite.create({
      data: {
        email: cleanEmail,
        token,
        workspaceId: cleanWorkspaceId,
        invitedById: inviterUserId,
        expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24),
      },
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
    });

    const frontendUrl = process.env.FRONTEND_URL?.split(',')[0]?.trim();

    if (!frontendUrl) {
      throw new BadRequestException('FRONTEND_URL não configurada.');
    }

    const inviteLink = `${frontendUrl}/invite/${token}`;

    await this.emailService.sendInviteEmail({
      to: cleanEmail,
      workspaceName: invite.workspace.name,
      invitedByName: invite.invitedBy.name,
      inviteLink,
    });

    return invite;
  }

  async getInviteByToken(token: string) {
    return this.getValidPendingInvite(token);
  }

  async acceptInvite(token: string, userId: string) {
    const invite = await this.getValidPendingInvite(token);

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
      },
    });

    if (!user) {
      throw new NotFoundException('Usuário não encontrado.');
    }

    if (user.email.toLowerCase() !== invite.email.toLowerCase()) {
      throw new ForbiddenException('Este convite foi enviado para outro email.');
    }

    await this.prisma.$transaction(async (tx) => {
      await tx.workspaceMember.upsert({
        where: {
          workspaceId_userId: {
            workspaceId: invite.workspaceId,
            userId,
          },
        },
        update: {},
        create: {
          userId,
          workspaceId: invite.workspaceId,
          role: 'MEMBER',
        },
      });

      await tx.workspaceInvite.update({
        where: { id: invite.id },
        data: { status: 'ACCEPTED' },
      });
    });

    return {
      message: 'Convite aceito com sucesso.',
    };
  }

  async declineInvite(token: string, userId: string) {
    const invite = await this.getValidPendingInvite(token);

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
      },
    });

    if (!user) {
      throw new NotFoundException('Usuário não encontrado.');
    }

    if (user.email.toLowerCase() !== invite.email.toLowerCase()) {
      throw new ForbiddenException('Este convite foi enviado para outro email.');
    }

    await this.prisma.workspaceInvite.update({
      where: { id: invite.id },
      data: { status: 'REJECTED' },
    });

    return {
      message: 'Convite recusado com sucesso.',
    };
  }
}