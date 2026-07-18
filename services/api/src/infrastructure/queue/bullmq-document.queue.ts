import { Injectable, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Queue } from 'bullmq';
import { IDocumentQueue } from '../../domain/services/document-queue.interface';

@Injectable()
export class BullMqDocumentQueue implements IDocumentQueue, OnModuleDestroy {
  private readonly queue: Queue;

  constructor(private readonly configService: ConfigService) {
    const redisUrl = this.configService.get<string>('REDIS_URL');
    this.queue = new Queue('document-processing', {
      connection: redisUrl
        ? { url: redisUrl }
        : { host: 'localhost', port: 6379 },
      defaultJobOptions: {
        attempts: 3,
        backoff: { type: 'exponential', delay: 5000 },
        removeOnComplete: { count: 100 },
        removeOnFail: { count: 100 },
      },
    });
  }

  async enqueue(documentId: string): Promise<void> {
    await this.queue.add('process', { documentId });
  }

  async onModuleDestroy(): Promise<void> {
    await this.queue.close();
  }
}
