import {
  ExtractedMetadata,
  ExtractionStatus,
} from '../../../domain/entities/document.entity';
import { ExtractedEntities } from '../../../domain/services/extractor-provider.interface';

export class DocumentResponseDto {
  id: string;
  patientProfileId: string;
  visitId?: string;
  uploadedBy: string;
  familyId?: string;
  originalName?: string;
  contentType?: string;
  size?: number;
  checksum?: string;
  status: string;
  storageProvider?: string;
  originalKey?: string;
  convertedKey?: string;
  thumbnailKey?: string;
  processingError?: string;
  retryCount: number;
  extractedMetadata: ExtractedMetadata;
  extractedEntities?: ExtractedEntities;
  extractionConfidence?: number;
  extractionStatus: ExtractionStatus;
  extractionError?: string;
  extractedAt?: Date;
  correctedBy?: string;
  correctedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}
