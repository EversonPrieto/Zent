import 'multer';
import {
  BadRequestException,
  Injectable,
  ForbiddenException,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateWorkspaceDto } from './dto/create-workspace.dto';
import { Role } from '@prisma/client';
import { CloudinaryService } from 'src/cloudinary/cloudinary.service';
import { AclService } from 'src/common/acl/acl.service';
import { LimitsService } from 'src/limits/limits.service';

@Injectable()
export class WorkspacesService {
  constructor(
    private prisma: PrismaService,
    private cloudinary: CloudinaryService,
    private acl: AclService,
    private limits: LimitsService,
  ) {}

  private async getMembershipOrThrow(workspaceId: string, userId: string) {
    if (!workspaceId?.trim()) {
      throw new BadRequestException('Workspace ID é obrigatório.');
    }

    const membership = await this.prisma.workspaceMember.findUnique({
      where: {
        workspaceId_userId: {
          workspaceId,
          userId,
        },
      },
      select: {
        id: true,
        role: true,
        userId: true,
        workspace: {
          select: {
            id: true,
            name: true,
            logoUrl: true,
          },
        },
      },
    });

    if (!membership) {
      throw new ForbiddenException('Você não pertence a este workspace.');
    }

    return membership;
  }

  private assertOwnerOrAdmin(role: Role, message: string) {
    if (role !== Role.OWNER && role !== Role.ADMIN) {
      throw new ForbiddenException(message);
    }
  }

  async create(userId: string, dto: CreateWorkspaceDto) {
    const name = dto.name?.trim();

    if (!name) {
      throw new BadRequestException('Nome do workspace é obrigatório.');
    }

    await this.limits.checkWorkspaceLimit(userId);

    return this.prisma.$transaction(async (tx) => {
      const workspace = await tx.workspace.create({
        data: { name },
      });

      await tx.workspaceMember.create({
        data: {
          userId,
          workspaceId: workspace.id,
          role: Role.OWNER,
        },
      });

      return workspace;
    });
  }

  async listForUser(userId: string) {
    const memberships = await this.prisma.workspaceMember.findMany({
      where: { userId },
      include: { workspace: true },
      orderBy: { createdAt: 'desc' },
    });

    return memberships.map((m) => ({
      id: m.workspace.id,
      name: m.workspace.name,
      logoUrl: m.workspace.logoUrl,
      role: m.role,
    }));
  }

  async current(userId: string, workspaceId: string) {
    const membership = await this.getMembershipOrThrow(workspaceId, userId);

    return {
      id: membership.workspace.id,
      name: membership.workspace.name,
      logoUrl: membership.workspace.logoUrl,
      role: membership.role,
    };
  }

  async update(workspaceId: string, userId: string, name: string) {
    const cleanName = name?.trim();

    if (!cleanName) {
      throw new BadRequestException('Nome do workspace é obrigatório.');
    }

    const membership = await this.getMembershipOrThrow(workspaceId, userId);

    this.assertOwnerOrAdmin(
      membership.role,
      'Você não tem permissão para editar este workspace.',
    );

    const workspace = await this.prisma.workspace.update({
      where: { id: workspaceId },
      data: { name: cleanName },
      select: {
        id: true,
        name: true,
        logoUrl: true,
        members: {
          where: { userId },
          select: { role: true },
          take: 1,
        },
      },
    });

    return {
      id: workspace.id,
      name: workspace.name,
      logoUrl: workspace.logoUrl,
      role: workspace.members[0]?.role ?? Role.MEMBER,
    };
  }

  async delete(workspaceId: string, userId: string) {
    await this.acl.requirePermission('workspace:delete', workspaceId, userId);

    await this.prisma.workspace.delete({
      where: { id: workspaceId },
    });

    return { message: 'Workspace deletado com sucesso.' };
  }

  async inviteMember(
    workspaceId: string,
    inviterUserId: string,
    email: string,
    role: 'ADMIN' | 'MEMBER' | 'VIEWER',
  ) {
    const inviterRole = await this.acl.requirePermission(
      'workspace:invite',
      workspaceId,
      inviterUserId,
    );

    if (!email?.trim()) {
      throw new BadRequestException('Email é obrigatório.');
    }

    const cleanEmail = email.trim().toLowerCase();

    if (!['ADMIN', 'MEMBER', 'VIEWER'].includes(role)) {
      throw new BadRequestException('Role inválida.');
    }

    if (role === 'ADMIN' && inviterRole !== Role.OWNER) {
      throw new ForbiddenException('Apenas OWNER pode convidar ADMIN.');
    }

    const user = await this.prisma.user.findUnique({
      where: { email: cleanEmail },
      select: {
        id: true,
        name: true,
        email: true,
        avatarUrl: true,
      },
    });

    if (!user) {
      throw new NotFoundException('Usuário não encontrado com esse email.');
    }

    const existingMembership = await this.prisma.workspaceMember.findFirst({
      where: {
        workspaceId,
        userId: user.id,
      },
    });

    if (existingMembership) {
      throw new ConflictException('Esse usuário já faz parte do workspace.');
    }

    const membership = await this.prisma.workspaceMember.create({
      data: {
        workspaceId,
        userId: user.id,
        role,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            avatarUrl: true,
          },
        },
      },
    });

    return {
      id: membership.id,
      role: membership.role,
      user: membership.user,
    };
  }

  async listMembers(workspaceId: string, userId: string) {
    await this.getMembershipOrThrow(workspaceId, userId);

    return this.prisma.workspaceMember.findMany({
      where: { workspaceId },
      orderBy: {
        createdAt: 'asc',
      },
      select: {
        id: true,
        role: true,
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            avatarUrl: true,
          },
        },
      },
    });
  }

  async updateMemberRole(
    workspaceId: string,
    requesterUserId: string,
    memberId: string,
    role: 'ADMIN' | 'MEMBER' | 'VIEWER',
  ) {
    const requesterRole = await this.acl.requirePermission(
      'workspace:update-member',
      workspaceId,
      requesterUserId,
    );

    if (!['ADMIN', 'MEMBER', 'VIEWER'].includes(role)) {
      throw new BadRequestException('Role inválida.');
    }

    const target = await this.prisma.workspaceMember.findFirst({
      where: {
        id: memberId,
        workspaceId,
      },
      select: {
        id: true,
        role: true,
        userId: true,
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            avatarUrl: true,
          },
        },
      },
    });

    if (!target) {
      throw new NotFoundException('Membro não encontrado.');
    }

    if (target.userId === requesterUserId) {
      throw new ForbiddenException('Você não pode alterar sua própria role.');
    }

    if (target.role === Role.OWNER) {
      throw new ForbiddenException('Você não pode alterar a role do OWNER.');
    }

    if (role === 'ADMIN' && requesterRole !== Role.OWNER) {
      throw new ForbiddenException('Apenas OWNER pode promover membros para ADMIN.');
    }

    if (requesterRole === Role.ADMIN) {
      if (target.role === Role.ADMIN) {
        throw new ForbiddenException('Você não pode alterar outro ADMIN.');
      }
    }

    const updated = await this.prisma.workspaceMember.update({
      where: { id: memberId },
      data: { role },
      select: {
        id: true,
        role: true,
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            avatarUrl: true,
          },
        },
      },
    });

    return updated;
  }

  async removeMember(
    workspaceId: string,
    requesterUserId: string,
    memberId: string,
  ) {
    const requesterRole = await this.acl.requirePermission(
      'workspace:remove-member',
      workspaceId,
      requesterUserId,
    );

    const target = await this.prisma.workspaceMember.findFirst({
      where: {
        id: memberId,
        workspaceId,
      },
      select: {
        id: true,
        role: true,
        userId: true,
      },
    });

    if (!target) {
      throw new NotFoundException('Membro não encontrado.');
    }

    if (target.userId === requesterUserId) {
      throw new ForbiddenException('Você não pode remover a si mesmo.');
    }

    if (target.role === Role.OWNER) {
      throw new ForbiddenException('Você não pode remover o OWNER.');
    }

    if (requesterRole === Role.ADMIN) {
      if (target.role === Role.ADMIN) {
        throw new ForbiddenException('Você não pode remover outro ADMIN.');
      }
    }

    await this.prisma.workspaceMember.delete({
      where: { id: memberId },
    });

    return { message: 'Membro removido com sucesso.' };
  }

  async updateLogo(
    workspaceId: string,
    userId: string,
    file: Express.Multer.File,
  ) {
    if (!file) {
      throw new BadRequestException('Arquivo é obrigatório.');
    }

    const membership = await this.getMembershipOrThrow(workspaceId, userId);

    this.assertOwnerOrAdmin(
      membership.role,
      'Você não tem permissão para editar este workspace.',
    );

    const uploaded = await this.cloudinary.uploadImage(file);

    const workspace = await this.prisma.workspace.update({
      where: { id: workspaceId },
      data: {
        logoUrl: uploaded.secure_url,
      },
      select: {
        id: true,
        name: true,
        logoUrl: true,
        members: {
          where: { userId },
          select: { role: true },
          take: 1,
        },
      },
    });

    return {
      id: workspace.id,
      name: workspace.name,
      logoUrl: workspace.logoUrl,
      role: workspace.members[0]?.role ?? Role.MEMBER,
    };
  }

  async getUserPermissions(workspaceId: string, userId: string) {
    return this.acl.getUserPermissions(workspaceId, userId);
  }
}