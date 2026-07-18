import { Injectable } from '@nestjs/common';
import { Repository } from 'typeorm';
import { Document } from '../../../domain/entities/document.entity';
import { IDocumentRepository } from '../../../domain/repositories/document.repository.interface';
import { DocumentOrmEntity } from '../entities/document.orm-entity';
import { RlsContextService } from '../../security/rls-context.service';

@Injectable()
export class TypeOrmDocumentRepository implements IDocumentRepository {
  constructor(private readonly rlsContext: RlsContextService) {}

  async findById(id: string): Promise<Document | null> {
    const entity = await this.getRepo().findOne({
      where: { id },
      withDeleted: true,
    });
    return entity ? this.toDomain(entity) : null;
  }

  async findByPatientProfileId(patientProfileId: string): Promise<Document[]> {
    const entities = await this.getRepo().find({
      where: { patientProfileId },
      withDeleted: true,
    });
    return entities.map((e) => this.toDomain(e));
  }

  async findByVisitId(visitId: string): Promise<Document[]> {
    const entities = await this.getRepo().find({
      where: { visitId },
      withDeleted: true,
    });
    return entities.map((e) => this.toDomain(e));
  }

  async save(document: Document): Promise<Document> {
    const saved = await this.getRepo().save(this.toOrm(document));
    return this.toDomain(saved);
  }

  async softDelete(id: string): Promise<void> {
    await this.getRepo().softDelete(id);
  }

  private getRepo(): Repository<DocumentOrmEntity> {
    return this.rlsContext.getManager().getRepository(DocumentOrmEntity);
  }

  private toDomain(entity: DocumentOrmEntity): Document {
    return new Document({
      id: entity.id,
      patientProfileId: entity.patientProfileId,
      visitId: entity.visitId ?? undefined,
      uploadedBy: entity.uploadedBy,
      familyId: entity.familyId ?? undefined,
      originalName: entity.originalName ?? undefined,
      contentType: entity.contentType ?? undefined,
      size: entity.size ?? undefined,
      checksum: entity.checksum ?? undefined,
      status: entity.status as Document['status'],
      storageProvider: entity.storageProvider ?? undefined,
      originalKey: entity.originalKey ?? undefined,
      convertedKey: entity.convertedKey ?? undefined,
      thumbnailKey: entity.thumbnailKey ?? undefined,
      processingError: entity.processingError ?? undefined,
      retryCount: entity.retryCount,
      extractedMetadata: entity.extractedMetadata ?? {},
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
      deletedAt: entity.deletedAt ?? undefined,
    });
  }

  private toOrm(document: Document): DocumentOrmEntity {
    const entity = new DocumentOrmEntity();
    entity.id = document.id;
    entity.patientProfileId = document.patientProfileId;
    entity.visitId = (document.visitId ?? null) as any;
    entity.uploadedBy = document.uploadedBy;
    entity.familyId = (document.familyId ?? null) as any;
    entity.originalName = (document.originalName ?? null) as any;
    entity.contentType = (document.contentType ?? null) as any;
    entity.size = (document.size ?? null) as any;
    entity.checksum = (document.checksum ?? null) as any;
    entity.status = document.status;
    entity.storageProvider = (document.storageProvider ?? null) as any;
    entity.originalKey = (document.originalKey ?? null) as any;
    entity.convertedKey = (document.convertedKey ?? null) as any;
    entity.thumbnailKey = (document.thumbnailKey ?? null) as any;
    entity.processingError = (document.processingError ?? null) as any;
    entity.retryCount = document.retryCount;
    entity.extractedMetadata = document.extractedMetadata ?? null;
    entity.createdAt = document.createdAt;
    entity.updatedAt = document.updatedAt;
    entity.deletedAt = (document.deletedAt ?? null) as any;
    return entity;
  }
}
