import { randomUUID } from 'crypto';
import { ExtractedEntities } from '../services/extractor-provider.interface';

export type DocumentStatus =
  | 'pending_upload'
  | 'uploaded'
  | 'scanning'
  | 'converting'
  | 'ready'
  | 'failed'
  | 'quarantined';

export type ExtractionStatus =
  'pending' | 'extracted' | 'needs_review' | 'corrected' | 'failed';

export interface ExtractedMetadata {
  width?: number;
  height?: number;
  pages?: number;
  fileSize?: number;
  mimeType?: string;
  [key: string]: unknown;
}

export interface DocumentProps {
  id?: string;
  patientProfileId: string;
  visitId?: string;
  uploadedBy: string;
  familyId?: string;
  originalName?: string;
  contentType?: string;
  size?: number;
  checksum?: string;
  status?: DocumentStatus;
  storageProvider?: string;
  originalKey?: string;
  convertedKey?: string;
  thumbnailKey?: string;
  processingError?: string;
  retryCount?: number;
  extractedMetadata?: ExtractedMetadata;
  extractedEntities?: ExtractedEntities;
  extractionConfidence?: number;
  extractionStatus?: ExtractionStatus;
  extractionError?: string;
  extractedAt?: Date;
  correctedBy?: string;
  correctedAt?: Date;
  createdAt?: Date;
  updatedAt?: Date;
  deletedAt?: Date;
}

export class Document {
  id: string;
  patientProfileId: string;
  visitId?: string;
  uploadedBy: string;
  familyId?: string;
  originalName?: string;
  contentType?: string;
  size?: number;
  checksum?: string;
  status: DocumentStatus;
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
  deletedAt?: Date;

  constructor(props: DocumentProps) {
    this.id = props.id ?? randomUUID();
    this.patientProfileId = props.patientProfileId;
    this.visitId = props.visitId;
    this.uploadedBy = props.uploadedBy;
    this.familyId = props.familyId;
    this.originalName = props.originalName?.trim();
    this.contentType = props.contentType;
    this.size = props.size;
    this.checksum = props.checksum;
    this.status = props.status ?? 'pending_upload';
    this.storageProvider = props.storageProvider;
    this.originalKey = props.originalKey;
    this.convertedKey = props.convertedKey;
    this.thumbnailKey = props.thumbnailKey;
    this.processingError = props.processingError;
    this.retryCount = props.retryCount ?? 0;
    this.extractedMetadata = props.extractedMetadata ?? {};
    this.extractedEntities = props.extractedEntities;
    this.extractionConfidence = props.extractionConfidence;
    this.extractionStatus = props.extractionStatus ?? 'pending';
    this.extractionError = props.extractionError;
    this.extractedAt = props.extractedAt;
    this.correctedBy = props.correctedBy;
    this.correctedAt = props.correctedAt;
    this.createdAt = props.createdAt ?? new Date();
    this.updatedAt = props.updatedAt ?? new Date();
    this.deletedAt = props.deletedAt;
  }

  markUploaded(size: number, checksum?: string): void {
    this.status = 'uploaded';
    this.size = size;
    this.checksum = checksum;
    this.updatedAt = new Date();
  }

  markScanning(): void {
    this.status = 'scanning';
    this.updatedAt = new Date();
  }

  markConverting(): void {
    this.status = 'converting';
    this.updatedAt = new Date();
  }

  markReady(
    convertedKey?: string,
    thumbnailKey?: string,
    metadata?: ExtractedMetadata,
  ): void {
    this.status = 'ready';
    if (convertedKey) this.convertedKey = convertedKey;
    if (thumbnailKey) this.thumbnailKey = thumbnailKey;
    if (metadata)
      this.extractedMetadata = { ...this.extractedMetadata, ...metadata };
    this.processingError = undefined;
    this.updatedAt = new Date();
  }

  markFailed(error: string): void {
    this.status = 'failed';
    this.processingError = error;
    this.retryCount += 1;
    this.updatedAt = new Date();
  }

  markQuarantined(reason: string): void {
    this.status = 'quarantined';
    this.processingError = reason;
    this.updatedAt = new Date();
  }

  softDelete(): void {
    this.deletedAt = new Date();
    this.updatedAt = new Date();
  }

  updateMetadata(metadata: ExtractedMetadata): void {
    this.extractedMetadata = { ...this.extractedMetadata, ...metadata };
    this.updatedAt = new Date();
  }

  applyExtraction(
    entities: ExtractedEntities,
    confidence: number,
    threshold: number,
  ): void {
    this.extractedEntities = entities;
    this.extractionConfidence = confidence;
    this.extractionStatus =
      confidence >= threshold ? 'extracted' : 'needs_review';
    this.extractionError = undefined;
    this.extractedAt = new Date();
    this.updatedAt = new Date();
  }

  applyExtractionError(error: string): void {
    this.extractionStatus = 'failed';
    this.extractionError = error;
    this.updatedAt = new Date();
  }

  correctExtraction(entities: ExtractedEntities, correctedBy: string): void {
    this.extractedEntities = entities;
    this.extractionStatus = 'corrected';
    this.extractionConfidence = 1.0;
    this.correctedBy = correctedBy;
    this.correctedAt = new Date();
    this.updatedAt = new Date();
  }
}
