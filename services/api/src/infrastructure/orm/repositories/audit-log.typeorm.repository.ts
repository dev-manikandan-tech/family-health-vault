import { Injectable } from '@nestjs/common';
import { Repository } from 'typeorm';
import { AuditLog } from '../../../domain/entities/audit-log.entity';
import { IAuditLogRepository } from '../../../domain/repositories/audit-log.repository.interface';
import { AuditLogOrmEntity } from '../entities/audit-log.orm-entity';
import { RlsContextService } from '../../security/rls-context.service';

@Injectable()
export class AuditLogTypeOrmRepository implements IAuditLogRepository {
  constructor(private readonly rlsContext: RlsContextService) {}

  async save(log: AuditLog): Promise<AuditLog> {
    const saved = await this.getRepo().save(this.toOrm(log));
    return this.toDomain(saved);
  }

  private getRepo(): Repository<AuditLogOrmEntity> {
    return this.rlsContext.getManager().getRepository(AuditLogOrmEntity);
  }

  private toOrm(log: AuditLog): AuditLogOrmEntity {
    const entity = new AuditLogOrmEntity();
    entity.id = log.id;
    entity.actorId = log.actorId;
    entity.action = log.action;
    entity.resourceType = log.resourceType;
    entity.resourceId = log.resourceId;
    entity.familyId = log.familyId;
    entity.patientProfileId = log.patientProfileId;
    entity.metadata = log.metadata;
    entity.ip = log.ip;
    entity.userAgent = log.userAgent;
    entity.createdAt = log.createdAt;
    return entity;
  }

  private toDomain(entity: AuditLogOrmEntity): AuditLog {
    return new AuditLog({
      id: entity.id,
      actorId: entity.actorId,
      action: entity.action,
      resourceType: entity.resourceType,
      resourceId: entity.resourceId,
      familyId: entity.familyId,
      patientProfileId: entity.patientProfileId,
      metadata: entity.metadata,
      ip: entity.ip,
      userAgent: entity.userAgent,
      createdAt: entity.createdAt,
    });
  }
}
