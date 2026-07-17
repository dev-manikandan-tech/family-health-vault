import { randomUUID } from 'crypto';

export interface RefreshTokenProps {
  id?: string;
  userId: string;
  tokenHash: string;
  expiresAt: Date;
  revokedAt?: Date;
  createdAt?: Date;
}

export class RefreshToken {
  id: string;
  userId: string;
  tokenHash: string;
  expiresAt: Date;
  revokedAt?: Date;
  createdAt: Date;

  constructor(props: RefreshTokenProps) {
    this.id = props.id ?? randomUUID();
    this.userId = props.userId;
    this.tokenHash = props.tokenHash;
    this.expiresAt = props.expiresAt;
    this.revokedAt = props.revokedAt;
    this.createdAt = props.createdAt ?? new Date();
  }

  isExpired(): boolean {
    return new Date() > this.expiresAt;
  }

  isRevoked(): boolean {
    return !!this.revokedAt;
  }

  revoke(): void {
    this.revokedAt = new Date();
  }
}
