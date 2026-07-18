import { Injectable } from '@nestjs/common';
import { Repository } from 'typeorm';
import {
  GrantScope,
  RecordAccessGrant,
} from '../../../domain/entities/record-access-grant.entity';
import { IRecordAccessGrantRepository } from '../../../domain/repositories/record-access-grant.repository.interface';
import { RecordAccessGrantOrmEntity } from '../entities/record-access-grant.orm-entity';
import { RlsContextService } from '../../security/rls-context.service';

@Injectable()
export class TypeOrmRecordAccessGrantRepository implements IRecordAccessGrantRepository {
  constructor(private readonly rlsContext: RlsContextService) {}

  async findById(id: string): Promise<RecordAccessGrant | null> {
    const entity = await this.getRepo().findOne({
      where: { id },
      withDeleted: true,
    });
    return entity ? this.toDomain(entity) : null;
  }

  async findByPatientProfileId(
    patientProfileId: string,
  ): Promise<RecordAccessGrant[]> {
    const entities = await this.getRepo().find({
      where: { patientProfileId },
      withDeleted: true,
    });
    return entities.map((e) => this.toDomain(e));
  }

  async findByGranteeUserIdAndProfileId(
    granteeUserId: string,
    patientProfileId: string,
  ): Promise<RecordAccessGrant | null> {
    const entity = await this.getRepo().findOne({
      where: { granteeUserId, patientProfileId },
      withDeleted: true,
    });
    return entity ? this.toDomain(entity) : null;
  }

  async findActiveByGranteeAndProfile(
    granteeUserId: string,
    patientProfileId: string,
  ): Promise<RecordAccessGrant | null> {
    const entities = await this.getRepo().find({
      where: { granteeUserId, patientProfileId },
    });
    const active = entities
      .map((e) => this.toDomain(e))
      .filter((g) => !g.isExpired());
    if (active.length === 0) return null;
    return active.reduce((best, current) =>
      current.isAtLeast(best.scope) ? current : best,
    );
  }

  async findActiveByGranteeUserId(
    granteeUserId: string,
  ): Promise<RecordAccessGrant[]> {
    const entities = await this.getRepo().find({
      where: { granteeUserId },
    });
    return entities.map((e) => this.toDomain(e)).filter((g) => !g.isExpired());
  }

  async save(grant: RecordAccessGrant): Promise<RecordAccessGrant> {
    const saved = await this.getRepo().save(this.toOrm(grant));
    return this.toDomain(saved);
  }

  async revoke(id: string): Promise<void> {
    await this.getRepo().softDelete(id);
  }

  private getRepo(): Repository<RecordAccessGrantOrmEntity> {
    return this.rlsContext
      .getManager()
      .getRepository(RecordAccessGrantOrmEntity);
  }

  private toDomain(entity: RecordAccessGrantOrmEntity): RecordAccessGrant {
    return new RecordAccessGrant({
      id: entity.id,
      patientProfileId: entity.patientProfileId,
      granteeUserId: entity.granteeUserId,
      scope: entity.scope as GrantScope,
      grantedBy: entity.grantedBy,
      expiresAt: entity.expiresAt ?? undefined,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
      deletedAt: entity.deletedAt ?? undefined,
    });
  }

  private toOrm(grant: RecordAccessGrant): RecordAccessGrantOrmEntity {
    const entity = new RecordAccessGrantOrmEntity();
    entity.id = grant.id;
    entity.patientProfileId = grant.patientProfileId;
    entity.granteeUserId = grant.granteeUserId;
    entity.scope = grant.scope;
    entity.grantedBy = grant.grantedBy;
    entity.expiresAt = (grant.expiresAt ?? null) as any;
    entity.createdAt = grant.createdAt;
    entity.updatedAt = grant.updatedAt;
    entity.deletedAt = (grant.deletedAt ?? null) as any;
    return entity;
  }
}
