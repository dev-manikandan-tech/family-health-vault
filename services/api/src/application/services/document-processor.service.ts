import { Inject, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AuthError, AuthErrorCode } from '../../domain/errors/auth.error';
import { Document } from '../../domain/entities/document.entity';
import { IAuditService } from '../../domain/services/audit-service.interface';
import { IDocumentRepository } from '../../domain/repositories/document.repository.interface';
import { IStorageProvider } from '../../domain/services/storage-provider.interface';
import { IVirusScanner } from '../../domain/services/virus-scanner.interface';
import { IImageConverter } from '../../domain/services/image-converter.interface';
import { IMetadataExtractor } from '../../domain/services/metadata-extractor.interface';
import { IDocumentProcessor } from '../../domain/services/document-processor.interface';
import { IExtractorProvider } from '../../domain/services/extractor-provider.interface';
import {
  AUDIT_SERVICE,
  DOCUMENT_REPOSITORY,
  EXTRACTOR_PROVIDER,
  IMAGE_CONVERTER,
  METADATA_EXTRACTOR,
  STORAGE_PROVIDER,
  VIRUS_SCANNER,
} from '../../domain/constants/injection-tokens';

@Injectable()
export class DocumentProcessor implements IDocumentProcessor {
  constructor(
    @Inject(DOCUMENT_REPOSITORY)
    private readonly documentRepository: IDocumentRepository,
    @Inject(STORAGE_PROVIDER)
    private readonly storageProvider: IStorageProvider,
    @Inject(VIRUS_SCANNER)
    private readonly virusScanner: IVirusScanner,
    @Inject(IMAGE_CONVERTER)
    private readonly imageConverter: IImageConverter,
    @Inject(METADATA_EXTRACTOR)
    private readonly metadataExtractor: IMetadataExtractor,
    @Inject(EXTRACTOR_PROVIDER)
    private readonly extractor: IExtractorProvider,
    @Inject(AUDIT_SERVICE)
    private readonly auditService: IAuditService,
    private readonly configService: ConfigService,
  ) {}

  async process(documentId: string): Promise<void> {
    const document = await this.documentRepository.findById(documentId);
    if (!document || document.deletedAt) {
      throw new AuthError(
        AuthErrorCode.PROFILE_NOT_FOUND,
        'Document not found',
      );
    }

    if (!document.originalKey || !document.contentType) {
      document.markFailed('Missing storage key or content type');
      await this.documentRepository.save(document);
      return;
    }

    try {
      document.markScanning();
      await this.documentRepository.save(document);

      const buffer = await this.storageProvider.getObject(document.originalKey);

      const scan = await this.virusScanner.scan(buffer);
      if (scan.isInfected) {
        document.markQuarantined(
          `Infected: ${scan.viruses?.join(', ') ?? 'unknown'}`,
        );
        await this.documentRepository.save(document);
        await this.auditService.log({
          action: 'DOCUMENT_QUARANTINED',
          resourceType: 'document',
          resourceId: document.id,
          actorId: document.uploadedBy,
          patientProfileId: document.patientProfileId,
          familyId: document.familyId,
          metadata: { reason: document.processingError },
        });
        return;
      }

      document.markConverting();
      await this.documentRepository.save(document);

      let convertedKey: string | undefined;
      let thumbnailKey: string | undefined;
      let extractionBuffer = buffer;
      let extractionMimeType = document.contentType;

      if (this.imageConverter.supports(document.contentType)) {
        const converted = await this.imageConverter.convert(buffer, {
          targetFormat: 'jpeg',
        });
        const thumbnail = await this.imageConverter.generateThumbnail(buffer, {
          width: 256,
          height: 256,
        });

        convertedKey = `documents/${document.patientProfileId}/${document.id}/converted.jpg`;
        thumbnailKey = `documents/${document.patientProfileId}/${document.id}/thumbnail.jpg`;

        await this.storageProvider.putObject(
          convertedKey,
          converted,
          'image/jpeg',
        );
        await this.storageProvider.putObject(
          thumbnailKey,
          thumbnail,
          'image/jpeg',
        );

        extractionBuffer = converted;
        extractionMimeType = 'image/jpeg';
      }

      const metadata = await this.metadataExtractor.extract(
        document.id,
        buffer,
        document.contentType,
      );

      document.markReady(convertedKey, thumbnailKey, metadata);
      await this.documentRepository.save(document);

      const threshold = parseFloat(
        this.configService.get<string>('EXTRACTION_CONFIDENCE_THRESHOLD') ??
          '0.7',
      );

      try {
        const extraction = await this.extractor.extract(
          document.id,
          extractionBuffer,
          extractionMimeType,
        );

        document.applyExtraction(
          extraction.entities,
          extraction.confidence,
          threshold,
        );
        await this.documentRepository.save(document);

        await this.auditService.log({
          action:
            document.extractionStatus === 'needs_review'
              ? 'DOCUMENT_EXTRACTION_NEEDS_REVIEW'
              : 'DOCUMENT_EXTRACTED',
          resourceType: 'document',
          resourceId: document.id,
          actorId: 'system',
          patientProfileId: document.patientProfileId,
          familyId: document.familyId,
          metadata: {
            documentType: extraction.documentType,
            confidence: extraction.confidence,
          },
        });
      } catch (extractionError: unknown) {
        const message =
          extractionError instanceof Error
            ? extractionError.message
            : 'Extraction failed';
        document.applyExtractionError(message);
        await this.documentRepository.save(document);
        await this.auditService.log({
          action: 'DOCUMENT_EXTRACTION_FAILED',
          resourceType: 'document',
          resourceId: document.id,
          actorId: 'system',
          patientProfileId: document.patientProfileId,
          familyId: document.familyId,
          metadata: { error: message },
        });
      }

      await this.auditService.log({
        action: 'DOCUMENT_PROCESSED',
        resourceType: 'document',
        resourceId: document.id,
        actorId: document.uploadedBy,
        patientProfileId: document.patientProfileId,
        familyId: document.familyId,
        metadata: {
          hasThumbnail: !!thumbnailKey,
          hasConverted: !!convertedKey,
        },
      });
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : 'Processing failed';
      document.markFailed(message);
      await this.documentRepository.save(document);
      await this.auditService.log({
        action: 'DOCUMENT_PROCESSING_FAILED',
        resourceType: 'document',
        resourceId: document.id,
        actorId: document.uploadedBy,
        patientProfileId: document.patientProfileId,
        familyId: document.familyId,
        metadata: { error: message, retryCount: document.retryCount },
      });
      throw error;
    }
  }
}
