import { AuditLog } from '../entities/audit-log.entity';

export interface AuditEvent {
  action: string;
  resourceType: string;
  resourceId?: string;
  familyId?: string;
  patientProfileId?: string;
  actorId: string;
  metadata?: Record<string, unknown>;
  ip?: string;
  userAgent?: string;
}

export interface IAuditService {
  log(event: AuditEvent): Promise<AuditLog>;
}
