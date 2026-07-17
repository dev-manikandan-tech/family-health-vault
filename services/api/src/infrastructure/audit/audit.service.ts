import { Inject, Injectable } from '@nestjs/common';
import {
  IAuditService,
  AuditEvent,
} from '../../domain/services/audit-service.interface';
import { AuditLog } from '../../domain/entities/audit-log.entity';
import { IAuditLogRepository } from '../../domain/repositories/audit-log.repository.interface';
import { AUDIT_LOG_REPOSITORY } from '../../domain/constants/injection-tokens';

@Injectable()
export class AuditService implements IAuditService {
  constructor(
    @Inject(AUDIT_LOG_REPOSITORY)
    private readonly auditLogRepository: IAuditLogRepository,
  ) {}

  async log(event: AuditEvent): Promise<AuditLog> {
    const log = new AuditLog({
      actorId: event.actorId,
      action: event.action,
      resourceType: event.resourceType,
      resourceId: event.resourceId,
      familyId: event.familyId,
      patientProfileId: event.patientProfileId,
      metadata: event.metadata,
      ip: event.ip,
      userAgent: event.userAgent,
    });
    return this.auditLogRepository.save(log);
  }
}
