import {
  Entity,
  PrimaryColumn,
  Column,
  CreateDateColumn,
  Index,
} from 'typeorm';

@Entity('timeline_events')
@Index(['patientProfileId'])
@Index(['eventType'])
@Index(['eventDate'])
export class TimelineEventOrmEntity {
  @PrimaryColumn('uuid')
  id: string;

  @Column({ name: 'patient_profile_id' })
  patientProfileId: string;

  @Column({ name: 'family_id', nullable: true })
  familyId?: string;

  @Column({ name: 'event_type', type: 'varchar' })
  eventType: string;

  @Column({ name: 'event_date' })
  eventDate: Date;

  @Column({ type: 'varchar' })
  title: string;

  @Column({ type: 'text', nullable: true })
  description?: string;

  @Column({ name: 'source_id', nullable: true, type: 'varchar' })
  sourceId?: string;

  @Column({ name: 'source_type', nullable: true, type: 'varchar' })
  sourceType?: string;

  @Column({ type: 'simple-json', nullable: true, name: 'metadata' })
  metadata?: Record<string, unknown>;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
