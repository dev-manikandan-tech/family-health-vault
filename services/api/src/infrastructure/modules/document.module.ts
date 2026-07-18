import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from './auth.module';
import { FamilyModule } from './family.module';
import { VisitModule } from './visit.module';
import { TimelineModule } from './timeline.module';
import { DatabaseModule } from '../database/database.module';
import { DocumentOrmEntity } from '../orm/entities/document.orm-entity';
import {
  DocumentController,
  DocumentDetailController,
} from '../../interface/controllers/document.controller';
import { DocumentApplicationService } from '../../application/services/document-application.service';
import { DocumentProcessor } from '../../application/services/document-processor.service';
import { TypeOrmDocumentRepository } from '../orm/repositories/document.typeorm.repository';
import { S3StorageProvider } from '../storage/s3-storage.provider';
import { NoopVirusScanner } from '../processing/noop-virus-scanner';
import { SharpImageConverter } from '../processing/sharp-image-converter';
import { BasicMetadataExtractor } from '../processing/basic-metadata-extractor';
import { SynchronousDocumentQueue } from '../queue/synchronous-document.queue';
import { BullMqDocumentQueue } from '../queue/bullmq-document.queue';
import { BullMqDocumentWorker } from '../queue/bullmq-document.worker';
import { isBullMqEnabled } from '../queue/queue-config';
import { FakeExtractorProvider } from '../ai/fake-extractor.provider';
import { GeminiExtractorProvider } from '../ai/gemini-extractor.provider';
import { ExtractorCircuitBreaker } from '../ai/extractor-circuit-breaker.service';
import { isGeminiEnabled } from '../ai/extractor-config';
import {
  DOCUMENT_REPOSITORY,
  EXTRACTOR_PROVIDER,
  STORAGE_PROVIDER,
  VIRUS_SCANNER,
  IMAGE_CONVERTER,
  METADATA_EXTRACTOR,
  DOCUMENT_QUEUE,
  DOCUMENT_PROCESSOR,
} from '../../domain/constants/injection-tokens';

@Module({
  imports: [
    AuthModule,
    FamilyModule,
    VisitModule,
    TimelineModule,
    DatabaseModule,
    TypeOrmModule.forFeature([DocumentOrmEntity]),
  ],
  controllers: [DocumentController, DocumentDetailController],
  providers: [
    DocumentApplicationService,
    DocumentProcessor,
    { provide: DOCUMENT_REPOSITORY, useClass: TypeOrmDocumentRepository },
    { provide: STORAGE_PROVIDER, useClass: S3StorageProvider },
    { provide: VIRUS_SCANNER, useClass: NoopVirusScanner },
    { provide: IMAGE_CONVERTER, useClass: SharpImageConverter },
    { provide: METADATA_EXTRACTOR, useClass: BasicMetadataExtractor },
    {
      provide: DOCUMENT_QUEUE,
      useClass: isBullMqEnabled()
        ? BullMqDocumentQueue
        : SynchronousDocumentQueue,
    },
    BullMqDocumentWorker,
    { provide: DOCUMENT_PROCESSOR, useExisting: DocumentProcessor },
    {
      provide: EXTRACTOR_PROVIDER,
      useClass: isGeminiEnabled()
        ? GeminiExtractorProvider
        : FakeExtractorProvider,
    },
    ExtractorCircuitBreaker,
  ],
  exports: [DocumentApplicationService, DocumentProcessor, DOCUMENT_REPOSITORY],
})
export class DocumentModule {}
