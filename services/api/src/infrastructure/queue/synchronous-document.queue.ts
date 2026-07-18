import { Inject, Injectable } from '@nestjs/common';
import { IDocumentQueue } from '../../domain/services/document-queue.interface';
import { IDocumentProcessor } from '../../domain/services/document-processor.interface';
import { DOCUMENT_PROCESSOR } from '../../domain/constants/injection-tokens';

@Injectable()
export class SynchronousDocumentQueue implements IDocumentQueue {
  constructor(
    @Inject(DOCUMENT_PROCESSOR)
    private readonly processor: IDocumentProcessor,
  ) {}

  async enqueue(documentId: string): Promise<void> {
    await this.processor.process(documentId);
  }
}
