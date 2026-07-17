import { Entity, PrimaryColumn, Column, CreateDateColumn } from 'typeorm';

@Entity('refresh_tokens')
export class RefreshTokenOrmEntity {
  @PrimaryColumn('uuid')
  id: string;

  @Column('uuid', { name: 'user_id' })
  userId: string;

  @Column({ name: 'token_hash' })
  tokenHash: string;

  @Column({ type: 'datetime', name: 'expires_at' })
  expiresAt: Date;

  @Column({ nullable: true, type: 'datetime', name: 'revoked_at' })
  revokedAt?: Date;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
