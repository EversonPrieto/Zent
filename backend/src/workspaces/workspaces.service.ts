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
}