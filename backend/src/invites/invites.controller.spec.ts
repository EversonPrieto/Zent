import { Test, TestingModule } from '@nestjs/testing';
import { InvitesController } from './invites.controller';
import { InvitesService } from './invites.service';

describe('InvitesController', () => {
  let controller: InvitesController;
  let service: InvitesService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [InvitesController],
      providers: [
        {
          provide: InvitesService,
          useValue: {
            createInvite: jest.fn(),
            getInviteByToken: jest.fn(),
            acceptInvite: jest.fn(),
            declineInvite: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<InvitesController>(InvitesController);
    service = module.get<InvitesService>(InvitesService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('create', () => {
    it('should call invitesService.createInvite', async () => {
      const createInviteDto = {
        email: 'test@example.com',
        workspaceId: 'workspace-123',
      };
      const req = { user: { sub: 'user-123' } };

      await controller.create(createInviteDto, req);

      expect(service.createInvite).toHaveBeenCalledWith(
        'test@example.com',
        'workspace-123',
        'user-123',
      );
    });
  });
});
