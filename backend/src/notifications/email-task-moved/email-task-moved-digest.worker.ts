import { Injectable, Logger, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { EmailTaskMovedDigestService } from './email-task-moved-digest.service';

@Injectable()
export class EmailTaskMovedDigestWorker implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(EmailTaskMovedDigestWorker.name);
  private timer: NodeJS.Timeout | null = null;

  constructor(private readonly service: EmailTaskMovedDigestService) {}

  onModuleInit() {
    // digest window anti-spam: processar com frequência maior que a janela
    const intervalMs = 30_000; // 30s
    this.logger.log(`EmailTaskMovedDigestWorker started. intervalMs=${intervalMs}`);
    this.timer = setInterval(() => {
      this.service.processQueue().catch((err) => {
        this.logger.error('processQueue failed', err as any);
      });
    }, intervalMs);
  }

  onModuleDestroy() {
    if (this.timer) clearInterval(this.timer);
    this.timer = null;
  }
}
