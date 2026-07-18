import {
  Entity,
  PrimaryColumn,
  Column,
  CreateDateColumn,
  Index,
} from 'typeorm';

@Entity('outbox_events')
@Index(['status'])
export class OutboxEventOrmEntity {
  @PrimaryColumn('uuid')
  id: string;

  @Column({ name: 'event_type', type: 'varchar' })
  eventType: string;

  @Column({ name: 'aggregate_type', type: 'varchar' })
  aggregateType: string;

  @Column({ name: 'aggregate_id', type: 'varchar' })
  aggregateId: string;

  @Column({ type: 'simple-json' })
  payload: Record<string, unknown>;

  @Column({ type: 'varchar', default: 'pending' })
  status: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @Column({ name: 'processed_at', nullable: true })
  processedAt?: Date;

  @Column({ type: 'text', nullable: true })
  error?: string;
}
