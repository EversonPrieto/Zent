import { Injectable, Logger } from '@nestjs/common';
import { EmailService } from 'src/common/email/email.service';
import { PrismaService } from 'src/prisma/prisma.service';

const DIGEST_WINDOW_MINUTES = 15;

@Injectable()
export class EmailTaskMovedDigestService {
  private readonly logger = new Logger(EmailTaskMovedDigestService.name);

  constructor(
    private prisma: PrismaService,
    private emailService: EmailService,
  ) {}

  async enqueue(params: {
    userId: string; // destinatário
    workspaceId: string;
    taskId: string;
    taskTitle: string | null;
    actorUserId: string | null;
    fromStatus: string;
    toStatus: string;
  }) {
    const now = new Date();
    const nextWindow = new Date(now.getTime());

    // janela: usamos updatedAt/lastActionAt + conta para merge simples
    nextWindow.setMinutes(nextWindow.getMinutes() - DIGEST_WINDOW_MINUTES);

    // anti-spam merge: um registro por (workspaceId, userId) e dentro da janela
    // Se existir algo PENDING/SENT mas ainda recente, incrementa; caso contrário cria.
    const existing = await this.prisma.emailTaskMovedDigest.findFirst({
      where: {
        workspaceId: params.workspaceId,
        userId: params.userId,
        status: 'PENDING',
        lastActionAt: {
          gte: nextWindow,
        },
      },
      orderBy: { lastActionAt: 'desc' },
    });

    let actorName: string | null = null;
    if (params.actorUserId) {
      const actor = await this.prisma.user.findUnique({
        where: { id: params.actorUserId },
        select: { name: true },
      });
      actorName = actor?.name ?? null;
    }

    if (existing) {
      await this.prisma.emailTaskMovedDigest.update({
        where: { id: existing.id },
        data: {
          count: existing.count + 1,
          lastTaskId: params.taskId,
          lastActionAt: now,
          // new fields (schema updated; cast to avoid stale Prisma typings)
          ...( {
            lastTaskTitle: params.taskTitle,
            actorName,
            fromStatus: params.fromStatus,
            toStatus: params.toStatus,
          } as any),
        } as any,
      });
      return;
    }

    await this.prisma.emailTaskMovedDigest.create({
      data: {
        userId: params.userId,
        workspaceId: params.workspaceId,
        count: 1,
        lastTaskId: params.taskId,
        lastActionAt: now,
        status: 'PENDING',
        nextSendAt: now, // worker vai buscar e enviar
        // new fields (schema updated; cast to avoid stale Prisma typings)
        ...( {
          lastTaskTitle: params.taskTitle,
          actorName,
          fromStatus: params.fromStatus,
          toStatus: params.toStatus,
        } as any),
      } as any,
    });
  }

  async processQueue() {
    const now = new Date();

    const items = await this.prisma.emailTaskMovedDigest.findMany({
      where: {
        status: 'PENDING',
        nextSendAt: { lte: now },
      },
      take: 50,
      orderBy: { nextSendAt: 'asc' },
    });

    for (const item of items) {
      try {
        // destinatário efetivo: se desativou depois de enfileirar, não manda
        const recipient = await this.prisma.user.findUnique({
          where: { id: item.userId },
          select: { id: true, email: true, name: true, emailNotificationsEnabled: true },
        });

        if (!recipient || !recipient.emailNotificationsEnabled) {
          await this.prisma.emailTaskMovedDigest.update({
            where: { id: item.id },
            data: { status: 'SENT', nextSendAt: new Date(now.getTime() + 1000) },
          });
          continue;
        }

        const workspaceName = await this.prisma.workspace.findUnique({
          where: { id: item.workspaceId },
          select: { name: true },
        });

        const itemAny = item as any;
        const taskTitle = itemAny.lastTaskTitle ?? null;

        const actorName = itemAny.actorName ?? null;
        const fromStatus = itemAny.fromStatus ?? '—';
        const toStatus = itemAny.toStatus ?? '—';

        const projectLink = `${process.env.FRONTEND_URL || ''}/dashboard/projects`;

        await this.emailService.sendTaskMovedDigestEmail({
          to: recipient.email,
          workspaceName: workspaceName?.name ?? 'Workspace',
          actorName,
          taskTitle,
          fromStatus,
          toStatus,
          movedCount: item.count,
          projectLink,
        });

        await this.prisma.emailTaskMovedDigest.update({
          where: { id: item.id },
          data: {
            status: 'SENT',
            nextSendAt: new Date(now.getTime() + 1000),
          },
        });
      } catch (err) {
        this.logger.error('Failed processing digest item', err as any);
        await this.prisma.emailTaskMovedDigest.update({
          where: { id: item.id },
          data: {
            status: 'FAILED',
            lastError: err instanceof Error ? err.message : String(err),
          },
        });
      }
    }
  }
}
