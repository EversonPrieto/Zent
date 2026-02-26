import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class WorkspaceGuard implements CanActivate {
  constructor(private prisma: PrismaService) {}

  async canActivate(context: ExecutionContext) {
    const req = context.switchToHttp().getRequest();

    const userId = req.user?.sub;
    const workspaceId = req.headers['x-workspace-id'] as string | undefined;

    if (!userId) throw new ForbiddenException('Usuário não autenticado.');
    if (!workspaceId) throw new ForbiddenException('x-workspace-id é obrigatório.');

    const membership = await this.prisma.workspaceMember.findUnique({
      where: { workspaceId_userId: { workspaceId, userId } },
      select: { role: true },
    });

    if (!membership) throw new ForbiddenException('Sem acesso a este workspace.');

    req.workspaceId = workspaceId;
    req.workspaceRole = membership.role;

    return true;
  }
}