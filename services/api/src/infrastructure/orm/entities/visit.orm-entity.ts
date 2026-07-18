import {
  Entity,
  PrimaryColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
  Index,
} from 'typeorm';

@Entity('visits')
@Index(['patientProfileId'])
export class VisitOrmEntity {
  @PrimaryColumn('uuid')
  id: string;

  @Column({ name: 'patient_profile_id' })
  patientProfileId: string;

  @Column({ name: 'family_id', nullable: true })
  familyId?: string;

  @Column({ nullable: true, type: 'varchar' })
  title?: string;

  @Column({ name: 'visited_at' })
  visitedAt: Date;

  @Column({ nullable: true, name: 'doctor_name', type: 'varchar' })
  doctorName?: string;

  @Column({ nullable: true, name: 'hospital_name', type: 'varchar' })
  hospitalName?: string;

  @Column({ nullable: true, type: 'text' })
  diagnosis?: string;

  @Column({ nullable: true, type: 'text' })
  notes?: string;

  @Column({ type: 'simple-array', nullable: true })
  symptoms: string[];

  @Column({ type: 'simple-array', nullable: true })
  medications: string[];

  @Column({ type: 'simple-array', nullable: true })
  labTests: string[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @DeleteDateColumn({ nullable: true, name: 'deleted_at' })
  deletedAt?: Date;
}
