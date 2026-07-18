import {
  Entity,
  PrimaryColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
  Index,
} from 'typeorm';

@Entity('patient_profiles')
@Index(['familyId'])
@Index(['userId'])
export class PatientProfileOrmEntity {
  @PrimaryColumn('uuid')
  id: string;

  @Column({ name: 'user_id', nullable: true })
  userId?: string;

  @Column({ name: 'family_id', nullable: true })
  familyId?: string;

  @Column({ type: 'varchar' })
  name: string;

  @Column({ nullable: true })
  dob?: Date;

  @Column({ nullable: true, type: 'varchar' })
  sex?: string;

  @Column({ nullable: true, name: 'blood_group', type: 'varchar' })
  bloodGroup?: string;

  @Column({ type: 'simple-array', nullable: true })
  allergies: string[];

  @Column({ nullable: true, name: 'abha_id', type: 'varchar' })
  abhaId?: string;

  @Column({ nullable: true, name: 'managed_by_user_id' })
  managedByUserId?: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @DeleteDateColumn({ nullable: true, name: 'deleted_at' })
  deletedAt?: Date;
}
