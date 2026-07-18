import { randomUUID } from 'crypto';

export type InvitationStatus = 'pending' | 'accepted' | 'expired' | 'cancelled';

export interface FamilyInvitationProps {
  id?: string;
  familyId: string;
  email: string;
  role: string;
  token?: string;
  invitedBy: string;
  status?: InvitationStatus;
  expiresAt?: Date;
  acceptedAt?: Date;
  createdAt?: Date;
  updatedAt?: Date;
  deletedAt?: Date;
}

export class FamilyInvitation {
  id: string;
  familyId: string;
  email: string;
  role: string;
  token: string;
  invitedBy: string;
  status: InvitationStatus;
  expiresAt: Date;
  acceptedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date;

  constructor(props: FamilyInvitationProps) {
    this.id = props.id ?? randomUUID();
    this.familyId = props.familyId;
    this.email = props.email.toLowerCase().trim();
    this.role = props.role;
    this.token = props.token ?? randomUUID();
    this.invitedBy = props.invitedBy;
    this.status = props.status ?? 'pending';
    this.expiresAt = props.expiresAt ?? this.defaultExpiry();
    this.acceptedAt = props.acceptedAt;
    this.createdAt = props.createdAt ?? new Date();
    this.updatedAt = props.updatedAt ?? new Date();
    this.deletedAt = props.deletedAt;
  }

  accept(): void {
    this.status = 'accepted';
    this.acceptedAt = new Date();
    this.updatedAt = new Date();
  }

  cancel(): void {
    this.status = 'cancelled';
    this.updatedAt = new Date();
  }

  isExpired(): boolean {
    return new Date() > this.expiresAt;
  }

  softDelete(): void {
    this.deletedAt = new Date();
    this.updatedAt = new Date();
  }

  private defaultExpiry(): Date {
    const date = new Date();
    date.setDate(date.getDate() + 7);
    return date;
  }
}
