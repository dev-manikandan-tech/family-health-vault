import {
  Injectable,
  OnModuleInit,
  OnModuleDestroy,
  Inject,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Worker, Job } from 'bullmq';
import { IDocumentProcessor } from '../../domain/services/document-processor.interface';
import { DOCUMENT_PROCESSOR } from '../../domain/constants/injection-tokens';

@Injectable()
export class BullMqDocumentWorker implements OnModuleInit, OnModuleDestroy {
  private worker?: Worker;

  constructor(
    private readonly configService: ConfigService,
    @Inject(DOCUMENT_PROCESSOR)
    private readonly processor: IDocumentProcessor,
  ) {}

  onModuleInit(): void {
    if (
      this.configService.get<string>('DOCUMENT_QUEUE_PROVIDER') !== 'bullmq'
    ) {
      return;
    }
    const redisUrl = this.configService.get<string>('REDIS_URL');
    this.worker = new Worker(
      'document-processing',
      async (job: Job<{ documentId: string }>) => {
        await this.processor.process(job.data.documentId);
      },
      {
        connection: redisUrl
          ? { url: redisUrl }
          : { host: 'localhost', port: 6379 },
      },
    );
  }

  async onModuleDestroy(): Promise<void> {
    if (this.worker) {
      await this.worker.close();
    }
  }
}
