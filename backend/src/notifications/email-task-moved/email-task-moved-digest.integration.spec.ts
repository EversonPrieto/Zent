import * as path from 'path';
import { config as dotenvConfig } from 'dotenv';

dotenvConfig({ path: path.resolve(__dirname, '../../../.env') });

import { Test, TestingModule } from '@nestjs/testing';
import { EmailTaskMovedDigestService } from './email-task-moved-digest.service';
import { PrismaService } from '../../prisma/prisma.service';
import { EmailService } from '../../common/email/email.service';

import { TasksService } from '../../tasks/tasks.service';
import { WorkspacesService } from '../../workspaces/workspaces.service';
import { ProjectsService } from '../../projects/projects.service';
import { Role, TaskPriority, TaskStatus } from '@prisma/client';

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

function logSection(title: string) {
  // eslint-disable-next-line no-console
  console.log('\n' + '='.repeat(80));
  // eslint-disable-next-line no-console
  console.log(title);
  // eslint-disable-next-line no-console
  console.log('='.repeat(80));
}

describe('EmailTaskMovedDigestService (integration)', () => {
  let moduleRef: TestingModule;
  let prisma: PrismaService;
  let digestService: EmailTaskMovedDigestService;
  let emailServiceMock: { sendTaskMovedDigestEmail: jest.Mock };

  let tasksService: TasksService;

  const testEmail = `email+task-moved-digest-${Date.now()}@example.com`;

  // IDs used across tests
  let userId: string;
  let workspaceId: string;
  let projectId: string;
  let taskId: string;

  beforeAll(async () => {
    emailServiceMock = {
      sendTaskMovedDigestEmail: jest.fn().mockResolvedValue({}),
    };

    moduleRef = await Test.createTestingModule({
      providers: [
        // PrismaService depends on ConfigService
        {
          provide: require('@nestjs/config').ConfigService,
          useValue: {
            get: (key: string) => {
              if (key === 'DATABASE_URL') return process.env.DATABASE_URL;
              if (key === 'BREVO_API_KEY') return process.env.BREVO_API_KEY;
              if (key === 'BREVO_SENDER_EMAIL') return process.env.BREVO_SENDER_EMAIL;
              if (key === 'FRONTEND_URL') return process.env.FRONTEND_URL;
              return process.env[key];
            },
          },
        },
        PrismaService,
        EmailTaskMovedDigestService,
        // Use digest+tasks directly; avoid wiring services with heavy dependencies.
        TasksService,
        {
          provide: EmailService,
          useValue: emailServiceMock,
        },
        // Stub collaborators required by TasksService ctor (by token is what Nest resolves)
        {
          provide: require('../../common/acl/acl.service').AclService,
          useValue: {
            requirePermission: jest.fn().mockResolvedValue(undefined),
            getUserPermissions: jest.fn().mockResolvedValue({}),
          },
        },
        {
          provide: require('../../activity/activity.service').ActivityService,
          useValue: {
            create: jest.fn().mockResolvedValue(undefined),
          },
        },
        {
          provide: require('../../tasks/tasks.gateway').TasksGateway,
          useValue: {
            emitTaskCreated: jest.fn(),
            emitTaskMoved: jest.fn(),
            emitTaskUpdated: jest.fn(),
            emitTaskDeleted: jest.fn(),
          },
        },
        {
          provide: require('../../limits/limits.service').LimitsService,
          useValue: {
            checkTaskLimit: jest.fn().mockResolvedValue(undefined),
          },
        }
      ],
    }).compile();

    prisma = moduleRef.get(PrismaService);
    digestService = moduleRef.get(EmailTaskMovedDigestService);
    // WorkspacesService/ProjectsService not strictly required for this integration test
    // (we only use TasksService + Prisma for data creation/moves).
    tasksService = moduleRef.get(TasksService);

    // Some services (WorkspacesService) depend on other providers.
    // Ensure module wiring works by creating required collaborators manually if needed.
    // For this test we mainly use Prisma-driven operations via services.
  });

  afterAll(async () => {
    await moduleRef?.close?.();
  });

  const printQueue = async (label: string) => {
    const items = await prisma.emailTaskMovedDigest.findMany({
      where: {
        userId,
        workspaceId,
      },
      orderBy: { createdAt: 'asc' },
    });

    // eslint-disable-next-line no-console
    console.log(`[${label}] queue items:`,
      items.map((i) => ({
        id: i.id,
        status: i.status,
        count: i.count,
        nextSendAt: i.nextSendAt,
        lastActionAt: i.lastActionAt,
        lastTaskTitle: i.lastTaskTitle,
      }))
    );
  };

  const cleanup = async () => {
    // remove queue rows first (fast)
    await prisma.emailTaskMovedDigest.deleteMany({
      where: { userId, workspaceId },
    }).catch(() => undefined);

    // delete task/project/workspace/user. WorkspaceMember and others have cascade where defined.
    await prisma.task.deleteMany({ where: { id: taskId } }).catch(() => undefined);
    await prisma.project.deleteMany({ where: { id: projectId } }).catch(() => undefined);
    await prisma.workspace.deleteMany({ where: { id: workspaceId } }).catch(() => undefined);
    await prisma.user.deleteMany({ where: { id: userId } }).catch(() => undefined);
  };

  const setupData = async () => {
    // ensure clean slate
    await prisma.emailTaskMovedDigest.deleteMany({ where: { userId: null as any } }).catch(() => undefined);

    const existing = await prisma.user.findUnique({ where: { email: testEmail } }).catch(() => null);
    if (existing) {
      await prisma.user.delete({ where: { id: existing.id } }).catch(() => undefined);
    }

    const createdUser = await prisma.user.create({
      data: {
        email: testEmail,
        password: 'test-password',
        name: 'Test Digest User',
        avatarUrl: null,
        emailNotificationsEnabled: true,
        plan: 'free',
      },
    });
    userId = createdUser.id;

    const createdWorkspace = await prisma.workspace.create({
      data: {
        name: `workspace-${Date.now()}`,
        members: {
          create: {
            userId,
            role: Role.OWNER,
          },
        },
      } as any,
    });
    workspaceId = createdWorkspace.id;

    // Create project
    const createdProject = await prisma.project.create({
      data: {
        workspaceId,
        name: `project-${Date.now()}`,
        completed: false,
      },
    });
    projectId = createdProject.id;

    // Create task
    const createdTask = await prisma.task.create({
      data: {
        projectId,
        title: 'Integration Task',
        description: 'desc',
        status: TaskStatus.TODO,
        priority: TaskPriority.MEDIUM,
        position: 1024,
        dueDate: null,
      },
    });
    taskId = createdTask.id;

    // Attach assignee to satisfy move() assumptions (move() itself doesn't require assignee)
    // but some parts of your app might rely on it.

    logSection('Setup do Banco concluído');
    // eslint-disable-next-line no-console
    console.log({ userId, workspaceId, projectId, taskId, testEmail });

    await printQueue('after setup');
  };

  beforeEach(async () => {
    await setupData();
  });

  afterEach(async () => {
    await cleanup();
    // eslint-disable-next-line no-console
    emailServiceMock.sendTaskMovedDigestEmail.mockClear();
  });

  it('Teste 1: enfileiramento anti-spam (janela 15 min) e incremento do count', async () => {
    logSection('Teste 1 - enqueue anti-spam');

    const moves = 5;
    for (let idx = 0; idx < moves; idx++) {
      const toStatus = idx % 2 === 0 ? TaskStatus.IN_PROGRESS : TaskStatus.DONE;
      await digestService.enqueue({
        userId,
        workspaceId,
        taskId: `${taskId}-${idx}`,
        taskTitle: 'Integration Task',
        actorUserId: userId,
        fromStatus: 'TODO',
        toStatus: String(toStatus),
      });
    }

    await printQueue('after multiple enqueues');

    const queued = await prisma.emailTaskMovedDigest.findMany({
      where: { userId, workspaceId, status: 'PENDING' },
    });

    // eslint-disable-next-line no-console
    console.log('PENDING queued count:', queued.length);

    expect(queued.length).toBe(1);
    expect(queued[0]?.count).toBe(moves);
  });

  it('Teste 2: processamento processQueue() PENDING -> SENT e envio via Brevo (mock)', async () => {
    logSection('Teste 2 - processQueue envia e muda status');

    const moves = 3;
    for (let idx = 0; idx < moves; idx++) {
      const toStatus = idx % 2 === 0 ? TaskStatus.IN_PROGRESS : TaskStatus.DONE;
      await digestService.enqueue({
        userId,
        workspaceId,
        taskId: `${taskId}-${idx}`,
        taskTitle: 'Integration Task',
        actorUserId: userId,
        fromStatus: 'TODO',
        toStatus: String(toStatus),
      });
    }

    await printQueue('before processQueue');

    const pendingBefore = await prisma.emailTaskMovedDigest.findMany({
      where: { userId, workspaceId, status: 'PENDING' },
    });

    expect(pendingBefore.length).toBe(1);

    await digestService.processQueue();

    await printQueue('after processQueue');

    const sent = await prisma.emailTaskMovedDigest.findMany({
      where: { userId, workspaceId, status: 'SENT' },
    });

    expect(sent.length).toBe(1);
    expect(emailServiceMock.sendTaskMovedDigestEmail).toHaveBeenCalledTimes(1);

    const payloadArg = emailServiceMock.sendTaskMovedDigestEmail.mock.calls[0]?.[0];
    expect(payloadArg).toEqual(
      expect.objectContaining({
        to: testEmail,
        movedCount: moves,
      }),
    );
  });

  it('Teste 3: toggle emailNotificationsEnabled=false -> não envia email', async () => {
    logSection('Teste 3 - toggle notifications desativado');

    // Disable notifications
    await prisma.user.update({
      where: { id: userId },
      data: { emailNotificationsEnabled: false },
    });

    const moves = 2;
    for (let idx = 0; idx < moves; idx++) {
      const toStatus = idx % 2 === 0 ? TaskStatus.IN_PROGRESS : TaskStatus.DONE;
      await digestService.enqueue({
        userId,
        workspaceId,
        taskId: `${taskId}-toggle-${idx}`,
        taskTitle: 'Integration Task',
        actorUserId: userId,
        fromStatus: 'TODO',
        toStatus: String(toStatus),
      });
    }

    await printQueue('before processQueue (notifications off)');

    emailServiceMock.sendTaskMovedDigestEmail.mockClear();

    await digestService.processQueue();

    await printQueue('after processQueue (notifications off)');

    const sent = await prisma.emailTaskMovedDigest.findMany({
      where: { userId, workspaceId },
    });

    expect(sent.length).toBe(1);
    expect(sent[0].status).toBe('SENT');

    expect(emailServiceMock.sendTaskMovedDigestEmail).not.toHaveBeenCalled();
  });
});

