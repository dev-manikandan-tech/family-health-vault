import { ExtractedMetadata } from '../../../domain/entities/document.entity';

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
  createdAt: Date;
  updatedAt: Date;
}
