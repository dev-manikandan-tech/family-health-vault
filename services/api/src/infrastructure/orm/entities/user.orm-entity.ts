import {
  Entity,
  PrimaryColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
} from 'typeorm';

@Entity('users')
export class UserOrmEntity {
  @PrimaryColumn('uuid')
  id: string;

  @Column({ unique: true })
  email: string;

  @Column({ nullable: true, name: 'password_hash' })
  passwordHash?: string;

  @Column({ name: 'auth_provider' })
  authProvider: string;

  @Column({ nullable: true, name: 'provider_user_id' })
  providerUserId?: string;

  @Column({ default: false, name: 'email_verified' })
  emailVerified: boolean;

  @Column({ default: false, name: 'mfa_enabled' })
  mfaEnabled: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @DeleteDateColumn({ nullable: true, name: 'deleted_at' })
  deletedAt?: Date;
}
