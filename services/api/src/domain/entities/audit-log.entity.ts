import { randomUUID } from 'crypto';

export interface AuditLogProps {
  id?: string;
  actorId: string;
  action: string;
  resourceType: string;
  resourceId?: string;
  familyId?: string;
  patientProfileId?: string;
  metadata?: Record<string, unknown>;
  ip?: string;
  userAgent?: string;
  createdAt?: Date;
}

export class AuditLog {
  id: string;
  actorId: string;
  action: string;
  resourceType: string;
  resourceId?: string;
  familyId?: string;
  patientProfileId?: string;
  metadata?: Record<string, unknown>;
  ip?: string;
  userAgent?: string;
  createdAt: Date;

  constructor(props: AuditLogProps) {
    this.id = props.id ?? randomUUID();
    this.actorId = props.actorId;
    this.action = props.action;
    this.resourceType = props.resourceType;
    this.resourceId = props.resourceId;
    this.familyId = props.familyId;
    this.patientProfileId = props.patientProfileId;
    this.metadata = props.metadata;
    this.ip = props.ip;
    this.userAgent = props.userAgent;
    this.createdAt = props.createdAt ?? new Date();
  }
}
