import {
  Entity,
  PrimaryColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
  Index,
} from 'typeorm';

@Entity('record_access_grants')
@Index(['patientProfileId'])
@Index(['granteeUserId'])
export class RecordAccessGrantOrmEntity {
  @PrimaryColumn('uuid')
  id: string;

  @Column({ name: 'patient_profile_id' })
  patientProfileId: string;

  @Column({ name: 'grantee_user_id' })
  granteeUserId: string;

  @Column({ type: 'varchar' })
  scope: string;

  @Column({ name: 'granted_by' })
  grantedBy: string;

  @Column({ nullable: true, name: 'expires_at' })
  expiresAt?: Date;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @DeleteDateColumn({ nullable: true, name: 'deleted_at' })
  deletedAt?: Date;
}
