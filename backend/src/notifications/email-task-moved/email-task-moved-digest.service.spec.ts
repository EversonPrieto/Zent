import { Test, TestingModule } from '@nestjs/testing';
import { EmailTaskMovedDigestService } from './email-task-moved-digest.service';
import { EmailService } from 'src/common/email/email.service';
import { PrismaService } from 'src/prisma/prisma.service';
import { EmailDigestStatus } from '@prisma/client';

describe('EmailTaskMovedDigestService', () => {
  let service: EmailTaskMovedDigestService;
  let emailService: EmailService;
  let prismaService: PrismaService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EmailTaskMovedDigestService,
        {
          provide: EmailService,
          useValue: {
            sendTaskMovedDigestEmail: jest.fn(),
          },
        },
        {
          provide: PrismaService,
          useValue: {
            emailTaskMovedDigest: {
              findFirst: jest.fn(),
              findMany: jest.fn(),
              create: jest.fn(),
              update: jest.fn(),
            },
            user: {
              findUnique: jest.fn(),
            },
            workspace: {
              findUnique: jest.fn(),
            },
          },
        },
      ],
    }).compile();

    service = module.get<EmailTaskMovedDigestService>(
      EmailTaskMovedDigestService,
    );
    emailService = module.get<EmailService>(EmailService);
    prismaService = module.get<PrismaService>(PrismaService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('enqueue', () => {
    it('should create a new digest entry if none exists', async () => {
      const params = {
        userId: 'user-123',
        workspaceId: 'workspace-123',
        taskId: 'task-123',
        taskTitle: 'Test Task',
        actorUserId: 'actor-123',
        fromStatus: 'TODO',
        toStatus: 'IN_PROGRESS',
      };

      (prismaService.emailTaskMovedDigest.findFirst as jest.Mock).mockResolvedValue(
        null,
      );
      (prismaService.user.findUnique as jest.Mock).mockResolvedValue({
        name: 'Test Actor',
      });
      (prismaService.emailTaskMovedDigest.create as jest.Mock).mockResolvedValue({
        id: 'digest-123',
      });

      await service.enqueue(params);

      expect(prismaService.emailTaskMovedDigest.create).toHaveBeenCalled();
    });

    it('should increment count if digest already exists within window', async () => {
      const params = {
        userId: 'user-123',
        workspaceId: 'workspace-123',
        taskId: 'task-124',
        taskTitle: 'Another Task',
        actorUserId: 'actor-123',
        fromStatus: 'IN_PROGRESS',
        toStatus: 'DONE',
      };

      const existingDigest = {
        id: 'digest-123',
        count: 1,
        lastActionAt: new Date(),
      };

      (prismaService.emailTaskMovedDigest.findFirst as jest.Mock).mockResolvedValue(
        existingDigest,
      );
      (prismaService.user.findUnique as jest.Mock).mockResolvedValue({
        name: 'Test Actor',
      });
      (prismaService.emailTaskMovedDigest.update as jest.Mock).mockResolvedValue({
        id: 'digest-123',
        count: 2,
      });

      await service.enqueue(params);

      expect(prismaService.emailTaskMovedDigest.update).toHaveBeenCalled();
    });
  });

  describe('processQueue', () => {
    it('should send digest email if user has notifications enabled', async () => {
      const digest = {
        id: 'digest-123',
        userId: 'user-123',
        workspaceId: 'workspace-123',
        count: 2,
        lastTaskTitle: 'Test Task',
        actorName: 'Test Actor',
        fromStatus: 'TODO',
        toStatus: 'DONE',
        nextSendAt: new Date(),
      };

      (prismaService.emailTaskMovedDigest.findMany as jest.Mock).mockResolvedValue(
        [digest],
      );
      (prismaService.user.findUnique as jest.Mock).mockResolvedValue({
        id: 'user-123',
        email: 'test@example.com',
        name: 'Test User',
        emailNotificationsEnabled: true,
      });
      (prismaService.workspace.findUnique as jest.Mock).mockResolvedValue({
        name: 'Test Workspace',
      });
      (emailService.sendTaskMovedDigestEmail as jest.Mock).mockResolvedValue({});
      (prismaService.emailTaskMovedDigest.update as jest.Mock).mockResolvedValue({});

      await service.processQueue();

      expect(emailService.sendTaskMovedDigestEmail).toHaveBeenCalledWith(
        expect.objectContaining({
          to: 'test@example.com',
          movedCount: 2,
        }),
      );
    });

    it('should skip if user has notifications disabled', async () => {
      const digest = {
        id: 'digest-123',
        userId: 'user-123',
        workspaceId: 'workspace-123',
        count: 1,
        nextSendAt: new Date(),
      };

      (prismaService.emailTaskMovedDigest.findMany as jest.Mock).mockResolvedValue(
        [digest],
      );
      (prismaService.user.findUnique as jest.Mock).mockResolvedValue({
        id: 'user-123',
        email: 'test@example.com',
        emailNotificationsEnabled: false,
      });
      (prismaService.emailTaskMovedDigest.update as jest.Mock).mockResolvedValue({});

      await service.processQueue();

      expect(emailService.sendTaskMovedDigestEmail).not.toHaveBeenCalled();
    });
  });
});
