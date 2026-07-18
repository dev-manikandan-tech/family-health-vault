import { randomUUID } from 'crypto';
import { Inject, Injectable } from '@nestjs/common';
import { AuthError, AuthErrorCode } from '../../domain/errors/auth.error';
import { Document } from '../../domain/entities/document.entity';
import { IAuditService } from '../../domain/services/audit-service.interface';
import { IDocumentRepository } from '../../domain/repositories/document.repository.interface';
import { IPatientProfileRepository } from '../../domain/repositories/patient-profile.repository.interface';
import { IVisitRepository } from '../../domain/repositories/visit.repository.interface';
import { IStorageProvider } from '../../domain/services/storage-provider.interface';
import { IDocumentQueue } from '../../domain/services/document-queue.interface';
import {
  AUDIT_SERVICE,
  DOCUMENT_QUEUE,
  DOCUMENT_REPOSITORY,
  PATIENT_PROFILE_REPOSITORY,
  STORAGE_PROVIDER,
  VISIT_REPOSITORY,
} from '../../domain/constants/injection-tokens';
import { AuthorizationService } from './authorization.service';
import { DeviceInfo } from './auth-application.service';
import {
  ConfirmUploadDto,
  CreateDocumentDto,
  DocumentResponseDto,
  PaginationQueryDto,
  PresignedUploadResponseDto,
} from '../dto';

@Injectable()
export class DocumentApplicationService {
  constructor(
    @Inject(DOCUMENT_REPOSITORY)
    private readonly documentRepository: IDocumentRepository,
    @Inject(PATIENT_PROFILE_REPOSITORY)
    private readonly patientProfileRepository: IPatientProfileRepository,
    @Inject(VISIT_REPOSITORY)
    private readonly visitRepository: IVisitRepository,
    @Inject(STORAGE_PROVIDER)
    private readonly storageProvider: IStorageProvider,
    @Inject(DOCUMENT_QUEUE)
    private readonly documentQueue: IDocumentQueue,
    @Inject(AUDIT_SERVICE)
    private readonly auditService: IAuditService,
    private readonly authorizationService: AuthorizationService,
  ) {}

  async requestPresignedUpload(
    userId: string,
    profileId: string,
    dto: CreateDocumentDto,
    deviceInfo: DeviceInfo,
  ): Promise<PresignedUploadResponseDto> {
    const profile = await this.patientProfileRepository.findById(profileId);
    if (!profile || profile.deletedAt) {
      throw new AuthError(AuthErrorCode.PROFILE_NOT_FOUND, 'Profile not found');
    }

    const canManage = await this.authorizationService.canManageProfile(
      userId,
      profileId,
    );
    const canFullGrant = await this.authorizationService.canAccessProfile(
      userId,
      profileId,
      'full',
    );
    if (!canManage && !canFullGrant) {
      throw new AuthError(AuthErrorCode.UNAUTHORIZED, 'Forbidden');
    }

    if (dto.visitId) {
      const visit = await this.visitRepository.findById(dto.visitId);
      if (!visit || visit.deletedAt || visit.patientProfileId !== profileId) {
        throw new AuthError(AuthErrorCode.PROFILE_NOT_FOUND, 'Visit not found');
      }
    }

    const document = new Document({
      patientProfileId: profileId,
      visitId: dto.visitId,
      uploadedBy: userId,
      familyId: profile.familyId,
      originalName: dto.originalName,
      contentType: dto.contentType,
      storageProvider: this.configuredProvider(),
      originalKey: this.buildKey(profileId, 'original'),
    });

    const saved = await this.documentRepository.save(document);

    const presigned = await this.storageProvider.getPresignedUploadUrl(
      saved.originalKey!,
      saved.contentType!,
    );

    await this.auditService.log({
      action: 'DOCUMENT_UPLOAD_REQUESTED',
      resourceType: 'document',
      resourceId: saved.id,
      actorId: userId,
      patientProfileId: profileId,
      familyId: profile.familyId,
      ip: deviceInfo.ipAddress,
      userAgent: deviceInfo.userAgent,
      metadata: {
        originalName: saved.originalName,
        contentType: saved.contentType,
      },
    });

    return {
      documentId: saved.id,
      uploadUrl: presigned.url,
      originalKey: saved.originalKey!,
      expiresInSeconds: 300,
    };
  }

  async confirmUpload(
    userId: string,
    documentId: string,
    dto: ConfirmUploadDto,
    deviceInfo: DeviceInfo,
  ): Promise<DocumentResponseDto> {
    const document = await this.documentRepository.findById(documentId);
    if (!document || document.deletedAt) {
      throw new AuthError(
        AuthErrorCode.PROFILE_NOT_FOUND,
        'Document not found',
      );
    }

    const canManage = await this.authorizationService.canManageProfile(
      userId,
      document.patientProfileId,
    );
    const canFullGrant = await this.authorizationService.canAccessProfile(
      userId,
      document.patientProfileId,
      'full',
    );
    if (!canManage && !canFullGrant) {
      throw new AuthError(AuthErrorCode.UNAUTHORIZED, 'Forbidden');
    }

    if (document.status !== 'pending_upload') {
      throw new AuthError(
        AuthErrorCode.ALREADY_MEMBER,
        'Document is not awaiting upload',
      );
    }

    const metadata = await this.storageProvider.getObjectMetadata(
      document.originalKey!,
    );
    if (!metadata || metadata.size !== dto.size) {
      throw new AuthError(
        AuthErrorCode.INVALID_INVITATION,
        'Uploaded object not found or size mismatch',
      );
    }

    document.markUploaded(dto.size, dto.checksum);
    const saved = await this.documentRepository.save(document);

    await this.auditService.log({
      action: 'DOCUMENT_UPLOADED',
      resourceType: 'document',
      resourceId: saved.id,
      actorId: userId,
      patientProfileId: saved.patientProfileId,
      familyId: saved.familyId,
      ip: deviceInfo.ipAddress,
      userAgent: deviceInfo.userAgent,
      metadata: { size: saved.size, checksum: saved.checksum },
    });

    await this.documentQueue.enqueue(saved.id);

    const processed = (await this.documentRepository.findById(saved.id))!;
    return this.toResponse(processed);
  }

  async listDocuments(
    userId: string,
    profileId: string,
    query: PaginationQueryDto,
  ): Promise<{ data: DocumentResponseDto[]; total: number }> {
    await this.authorizationService.requireProfileAccess(
      userId,
      profileId,
      'visits_only',
    );

    const documents = (
      await this.documentRepository.findByPatientProfileId(profileId)
    ).filter((d) => !d.deletedAt);

    let filtered = documents;
    if (query.search) {
      const term = query.search.toLowerCase();
      filtered = documents.filter(
        (d) => d.originalName?.toLowerCase().includes(term) ?? false,
      );
    }

    const sorted = filtered.sort(
      (a, b) => b.createdAt.getTime() - a.createdAt.getTime(),
    );
    const total = sorted.length;
    const paginated = sorted.slice(query.offset, query.offset + query.limit);

    return { data: paginated.map((d) => this.toResponse(d)), total };
  }

  async getDocument(
    userId: string,
    documentId: string,
  ): Promise<DocumentResponseDto> {
    const document = await this.requireDocument(
      userId,
      documentId,
      'visits_only',
    );
    return this.toResponse(document);
  }

  async getDownloadUrl(
    userId: string,
    documentId: string,
    variant: 'original' | 'converted' | 'thumbnail' = 'original',
  ): Promise<string> {
    const document = await this.requireDocument(
      userId,
      documentId,
      'visits_only',
    );

    const key =
      variant === 'converted'
        ? document.convertedKey
        : variant === 'thumbnail'
          ? document.thumbnailKey
          : document.originalKey;

    if (!key) {
      throw new AuthError(
        AuthErrorCode.PROFILE_NOT_FOUND,
        'Variant not available',
      );
    }

    await this.auditService.log({
      action: 'DOCUMENT_DOWNLOADED',
      resourceType: 'document',
      resourceId: document.id,
      actorId: userId,
      patientProfileId: document.patientProfileId,
      familyId: document.familyId,
      metadata: { variant },
    });

    return this.storageProvider.getPresignedDownloadUrl(key);
  }

  async deleteDocument(
    userId: string,
    documentId: string,
    deviceInfo: DeviceInfo,
  ): Promise<void> {
    const document = await this.requireDocument(userId, documentId, 'full');

    await this.documentRepository.softDelete(documentId);

    await this.auditService.log({
      action: 'DOCUMENT_DELETED',
      resourceType: 'document',
      resourceId: document.id,
      actorId: userId,
      patientProfileId: document.patientProfileId,
      familyId: document.familyId,
      ip: deviceInfo.ipAddress,
      userAgent: deviceInfo.userAgent,
    });
  }

  private async requireDocument(
    userId: string,
    documentId: string,
    requiredScope: 'visits_only' | 'full',
  ): Promise<Document> {
    const document = await this.documentRepository.findById(documentId);
    if (!document || document.deletedAt) {
      throw new AuthError(
        AuthErrorCode.PROFILE_NOT_FOUND,
        'Document not found',
      );
    }

    const canManage = await this.authorizationService.canManageProfile(
      userId,
      document.patientProfileId,
    );
    const hasGrant = await this.authorizationService.canAccessProfile(
      userId,
      document.patientProfileId,
      requiredScope,
    );
    if (!canManage && !hasGrant) {
      throw new AuthError(AuthErrorCode.UNAUTHORIZED, 'Forbidden');
    }

    return document;
  }

  private configuredProvider(): string {
    return process.env.STORAGE_PROVIDER ?? 's3';
  }

  private buildKey(profileId: string, variant: string): string {
    const id = randomUUID();
    return `documents/${profileId}/${id}/${variant}`;
  }

  private toResponse(document: Document): DocumentResponseDto {
    return {
      id: document.id,
      patientProfileId: document.patientProfileId,
      visitId: document.visitId,
      uploadedBy: document.uploadedBy,
      familyId: document.familyId,
      originalName: document.originalName,
      contentType: document.contentType,
      size: document.size,
      checksum: document.checksum,
      status: document.status,
      storageProvider: document.storageProvider,
      originalKey: document.originalKey,
      convertedKey: document.convertedKey,
      thumbnailKey: document.thumbnailKey,
      processingError: document.processingError,
      retryCount: document.retryCount,
      extractedMetadata: document.extractedMetadata,
      createdAt: document.createdAt,
      updatedAt: document.updatedAt,
    };
  }
}
