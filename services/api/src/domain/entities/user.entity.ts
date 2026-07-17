import { randomUUID } from 'crypto';

export type AuthProvider = 'email' | 'google' | 'apple' | 'phone';

export interface UserProps {
  id?: string;
  email?: string;
  phone?: string;
  authProvider: AuthProvider;
  providerUserId?: string;
  emailVerified?: boolean;
  phoneVerified?: boolean;
  mfaEnabled?: boolean;
  deletionRequestedAt?: Date;
  createdAt?: Date;
  updatedAt?: Date;
  deletedAt?: Date;
}

export class User {
  id: string;
  email?: string;
  phone?: string;
  authProvider: AuthProvider;
  providerUserId?: string;
  emailVerified: boolean;
  phoneVerified: boolean;
  mfaEnabled: boolean;
  deletionRequestedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date;

  constructor(props: UserProps) {
    this.id = props.id ?? randomUUID();
    this.email = props.email?.toLowerCase().trim();
    this.phone = props.phone?.trim();
    this.authProvider = props.authProvider;
    this.providerUserId = props.providerUserId;
    this.emailVerified = props.emailVerified ?? false;
    this.phoneVerified = props.phoneVerified ?? false;
    this.mfaEnabled = props.mfaEnabled ?? false;
    this.deletionRequestedAt = props.deletionRequestedAt;
    this.createdAt = props.createdAt ?? new Date();
    this.updatedAt = props.updatedAt ?? new Date();
    this.deletedAt = props.deletedAt;
  }

  updateProfile(updates: Partial<Pick<User, 'email' | 'phone'>>): void {
    if (updates.email) this.email = updates.email.toLowerCase().trim();
    if (updates.phone) this.phone = updates.phone.trim();
    this.updatedAt = new Date();
  }

  verifyEmail(): void {
    this.emailVerified = true;
    this.updatedAt = new Date();
  }

  verifyPhone(): void {
    this.phoneVerified = true;
    this.updatedAt = new Date();
  }

  enableMfa(): void {
    this.mfaEnabled = true;
    this.updatedAt = new Date();
  }

  requestDeletion(): void {
    this.deletionRequestedAt = new Date();
    this.updatedAt = new Date();
  }

  softDelete(): void {
    this.deletedAt = new Date();
    this.updatedAt = new Date();
  }

  restore(): void {
    this.deletedAt = undefined;
    this.deletionRequestedAt = undefined;
    this.updatedAt = new Date();
  }
}
