import { randomUUID } from 'crypto';

export type GrantScope = 'full' | 'visits_only' | 'emergency_card';

const scopeHierarchy: Record<GrantScope, number> = {
  full: 3,
  visits_only: 2,
  emergency_card: 1,
};

export interface RecordAccessGrantProps {
  id?: string;
  patientProfileId: string;
  granteeUserId: string;
  scope: GrantScope;
  grantedBy: string;
  expiresAt?: Date;
  createdAt?: Date;
  updatedAt?: Date;
  deletedAt?: Date;
}

export class RecordAccessGrant {
  id: string;
  patientProfileId: string;
  granteeUserId: string;
  scope: GrantScope;
  grantedBy: string;
  expiresAt?: Date;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date;

  constructor(props: RecordAccessGrantProps) {
    this.id = props.id ?? randomUUID();
    this.patientProfileId = props.patientProfileId;
    this.granteeUserId = props.granteeUserId;
    this.scope = props.scope;
    this.grantedBy = props.grantedBy;
    this.expiresAt = props.expiresAt;
    this.createdAt = props.createdAt ?? new Date();
    this.updatedAt = props.updatedAt ?? new Date();
    this.deletedAt = props.deletedAt;
  }

  isExpired(): boolean {
    return !!this.expiresAt && new Date() > this.expiresAt;
  }

  isAtLeast(scope: GrantScope): boolean {
    return scopeHierarchy[this.scope] >= scopeHierarchy[scope];
  }

  revoke(): void {
    this.deletedAt = new Date();
    this.updatedAt = new Date();
  }
}
