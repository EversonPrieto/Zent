import { Injectable, ForbiddenException } from '@nestjs/common';
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
}