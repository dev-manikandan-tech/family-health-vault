import {
  Entity,
  PrimaryColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
  Index,
} from 'typeorm';

@Entity('users')
@Index(['email'])
export class UserOrmEntity {
  @PrimaryColumn()
  id: string;

  @Column({ type: 'varchar', nullable: true })
  email: string | null;

  @Column({ type: 'varchar', nullable: true })
  phone: string | null;

  @Column({ name: 'auth_provider' })
  authProvider: string;

  @Column({ type: 'varchar', nullable: true, name: 'provider_user_id' })
  providerUserId: string | null;

  @Column({ default: false, name: 'email_verified' })
  emailVerified: boolean;

  @Column({ default: false, name: 'phone_verified' })
  phoneVerified: boolean;

  @Column({ default: false, name: 'mfa_enabled' })
  mfaEnabled: boolean;

  @Column({ nullable: true, name: 'deletion_requested_at' })
  deletionRequestedAt?: Date;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @DeleteDateColumn({ nullable: true, name: 'deleted_at' })
  deletedAt?: Date;
}
