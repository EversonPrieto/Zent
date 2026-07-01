import { Test, TestingModule } from '@nestjs/testing';
import { EmailTaskMovedDigestWorker } from './email-task-moved-digest.worker';
import { EmailTaskMovedDigestService } from './email-task-moved-digest.service';

describe('EmailTaskMovedDigestWorker', () => {
  let worker: EmailTaskMovedDigestWorker;
  let service: EmailTaskMovedDigestService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EmailTaskMovedDigestWorker,
        {
          provide: EmailTaskMovedDigestService,
          useValue: {
            processQueue: jest.fn(),
          },
        },
      ],
    }).compile();

    worker = module.get<EmailTaskMovedDigestWorker>(
      EmailTaskMovedDigestWorker,
    );
    service = module.get<EmailTaskMovedDigestService>(
      EmailTaskMovedDigestService,
    );
  });

  afterEach(() => {
    if (worker) {
      worker.onModuleDestroy();
    }
  });

  it('should be defined', () => {
    expect(worker).toBeDefined();
  });

  it('should start timer on module init', () => {
    jest.useFakeTimers();
    
    worker.onModuleInit();
    expect(service.processQueue).not.toHaveBeenCalled();

    jest.advanceTimersByTime(30_000);
    expect(service.processQueue).toHaveBeenCalled();

    jest.useRealTimers();
  });

  it('should clear timer on module destroy', () => {
    worker.onModuleInit();
    const timerSpy = jest.spyOn(global, 'clearInterval');
    
    worker.onModuleDestroy();
    expect(timerSpy).toHaveBeenCalled();
    
    timerSpy.mockRestore();
  });
});
