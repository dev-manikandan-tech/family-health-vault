import {
  Entity,
  PrimaryColumn,
  Column,
  CreateDateColumn,
  Index,
} from 'typeorm';

@Entity('audit_logs')
@Index(['actorId'])
@Index(['action'])
@Index(['resourceType', 'resourceId'])
export class AuditLogOrmEntity {
  @PrimaryColumn('uuid')
  id: string;

  @Column({ name: 'actor_id' })
  actorId: string;

  @Column({ name: 'action' })
  action: string;

  @Column({ name: 'resource_type' })
  resourceType: string;

  @Column({ name: 'resource_id', nullable: true })
  resourceId?: string;

  @Column({ name: 'family_id', nullable: true })
  familyId?: string;

  @Column({ name: 'patient_profile_id', nullable: true })
  patientProfileId?: string;

  @Column({ type: 'simple-json', nullable: true })
  metadata?: Record<string, unknown>;

  @Column({ nullable: true, name: 'ip_address' })
  ip?: string;

  @Column({ nullable: true, name: 'user_agent' })
  userAgent?: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
