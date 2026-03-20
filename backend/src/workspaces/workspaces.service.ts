import { Injectable, ForbiddenException, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateWorkspaceDto } from './dto/create-workspace.dto';
import { Role } from '@prisma/client';

@Injectable()
export class WorkspacesService {
    constructor(private prisma: PrismaService) { }

    async create(userId: string, dto: CreateWorkspaceDto) {
        return this.prisma.$transaction(async (tx) => {
            const workspace = await tx.workspace.create({
                data: { name: dto.name },
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
        const membership = await this.prisma.workspaceMember.findUnique({
            where: { workspaceId_userId: { workspaceId, userId } },
            include: { workspace: true },
        });

        if (!membership) {
            throw new ForbiddenException('Sem acesso a este workspace.');
        }

        return {
            id: membership.workspace.id,
            name: membership.workspace.name,
            logoUrl: membership.workspace.logoUrl,
            role: membership.role,
        };
    }

    async update(workspaceId: string, userId: string, name: string) {
        const membership = await this.prisma.workspaceMember.findFirst({
            where: {
                workspaceId,
                userId,
            },
            select: {
                role: true,
            },
        });

        if (!membership) {
            throw new ForbiddenException('Você não pertence a este workspace.');
        }

        if (!['OWNER', 'ADMIN'].includes(membership.role)) {
            throw new ForbiddenException('Você não tem permissão para editar este workspace.');
        }

        return this.prisma.workspace.update({
            where: { id: workspaceId },
            data: { name },
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
        }).then((workspace) => ({
            id: workspace.id,
            name: workspace.name,
            logoUrl: workspace.logoUrl,
            role: workspace.members[0]?.role ?? 'MEMBER',
        }));
    }
    
    async delete(workspaceId: string, userId: string) {
        const membership = await this.prisma.workspaceMember.findFirst({
            where: {
                workspaceId,
                userId,
            },
            select: {
                role: true,
            },
        });

        if (!membership || membership.role !== 'OWNER') {
            throw new ForbiddenException('Apenas o OWNER pode deletar o workspace.');
        }

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
        const inviterMembership = await this.prisma.workspaceMember.findFirst({
            where: {
                workspaceId,
                userId: inviterUserId,
            },
            select: {
                role: true,
            },
        });

        if (!inviterMembership) {
            throw new ForbiddenException('Você não pertence a este workspace.');
        }

        if (!['OWNER', 'ADMIN'].includes(inviterMembership.role)) {
            throw new ForbiddenException('Você não tem permissão para convidar membros.');
        }

        const user = await this.prisma.user.findUnique({
            where: { email },
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
        const membership = await this.prisma.workspaceMember.findFirst({
            where: {
                workspaceId,
                userId,
            },
            select: { id: true },
        });

        if (!membership) {
            throw new ForbiddenException('Você não pertence a este workspace.');
        }

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
        const requester = await this.prisma.workspaceMember.findFirst({
            where: {
                workspaceId,
                userId: requesterUserId,
            },
            select: {
                id: true,
                role: true,
            },
        });

        if (!requester) {
            throw new ForbiddenException('Você não pertence a este workspace.');
        }

        if (!['OWNER', 'ADMIN'].includes(requester.role)) {
            throw new ForbiddenException('Você não tem permissão para alterar membros.');
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

        if (requester.role === 'ADMIN') {
            if (target.role === 'OWNER' || target.role === 'ADMIN') {
                throw new ForbiddenException('Você não pode alterar este membro.');
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
        const requester = await this.prisma.workspaceMember.findFirst({
            where: {
                workspaceId,
                userId: requesterUserId,
            },
            select: {
                id: true,
                role: true,
            },
        });

        if (!requester) {
            throw new ForbiddenException('Você não pertence a este workspace.');
        }

        if (!['OWNER', 'ADMIN'].includes(requester.role)) {
            throw new ForbiddenException('Você não tem permissão para remover membros.');
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
            },
        });

        if (!target) {
            throw new NotFoundException('Membro não encontrado.');
        }

        if (target.userId === requesterUserId) {
            throw new ForbiddenException('Você não pode remover a si mesmo.');
        }

        if (requester.role === 'ADMIN') {
            if (target.role === 'OWNER' || target.role === 'ADMIN') {
                throw new ForbiddenException('Você não pode remover este membro.');
            }
        }

        await this.prisma.workspaceMember.delete({
            where: { id: memberId },
        });

        return { message: 'Membro removido com sucesso.' };
    }
}