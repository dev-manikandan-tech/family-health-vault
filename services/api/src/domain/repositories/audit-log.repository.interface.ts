import { AuditLog } from '../entities/audit-log.entity';

export interface IAuditLogRepository {
  save(log: AuditLog): Promise<AuditLog>;
}
