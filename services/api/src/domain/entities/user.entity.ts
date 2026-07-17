import { randomUUID } from 'crypto';

export type AuthProvider = 'email' | 'google' | 'apple';

export interface UserProps {
  id?: string;
  email: string;
  passwordHash?: string;
  authProvider: AuthProvider;
  providerUserId?: string;
  emailVerified?: boolean;
  mfaEnabled?: boolean;
  createdAt?: Date;
  updatedAt?: Date;
  deletedAt?: Date;
}

export class User {
  id: string;
  email: string;
  passwordHash?: string;
  authProvider: AuthProvider;
  providerUserId?: string;
  emailVerified: boolean;
  mfaEnabled: boolean;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date;

  constructor(props: UserProps) {
    this.id = props.id ?? randomUUID();
    this.email = props.email.toLowerCase().trim();
    this.passwordHash = props.passwordHash;
    this.authProvider = props.authProvider;
    this.providerUserId = props.providerUserId;
    this.emailVerified = props.emailVerified ?? false;
    this.mfaEnabled = props.mfaEnabled ?? false;
    this.createdAt = props.createdAt ?? new Date();
    this.updatedAt = props.updatedAt ?? new Date();
    this.deletedAt = props.deletedAt;
  }

  verifyEmail(): void {
    this.emailVerified = true;
    this.updatedAt = new Date();
  }

  enableMfa(): void {
    this.mfaEnabled = true;
    this.updatedAt = new Date();
  }

  updatePassword(passwordHash: string): void {
    this.passwordHash = passwordHash;
    this.updatedAt = new Date();
  }

  softDelete(): void {
    this.deletedAt = new Date();
  }
}
