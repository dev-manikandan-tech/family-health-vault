import { OutboxEvent } from '../entities/outbox-event.entity';

export interface IOutboxEventRepository {
  save(event: OutboxEvent): Promise<OutboxEvent>;
  findPending(limit: number): Promise<OutboxEvent[]>;
}
