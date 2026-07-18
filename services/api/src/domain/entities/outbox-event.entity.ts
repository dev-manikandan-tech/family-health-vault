import { randomUUID } from 'crypto';

export type OutboxStatus = 'pending' | 'processed' | 'failed';

export interface OutboxEventProps {
  id?: string;
  eventType: string;
  aggregateType: string;
  aggregateId: string;
  payload: Record<string, unknown>;
  status?: OutboxStatus;
  createdAt?: Date;
  processedAt?: Date;
  error?: string;
}

export class OutboxEvent {
  id: string;
  eventType: string;
  aggregateType: string;
  aggregateId: string;
  payload: Record<string, unknown>;
  status: OutboxStatus;
  createdAt: Date;
  processedAt?: Date;
  error?: string;

  constructor(props: OutboxEventProps) {
    this.id = props.id ?? randomUUID();
    this.eventType = props.eventType;
    this.aggregateType = props.aggregateType;
    this.aggregateId = props.aggregateId;
    this.payload = props.payload;
    this.status = props.status ?? 'pending';
    this.createdAt = props.createdAt ?? new Date();
    this.processedAt = props.processedAt;
    this.error = props.error;
  }

  markProcessed(): void {
    this.status = 'processed';
    this.processedAt = new Date();
  }

  markFailed(error: string): void {
    this.status = 'failed';
    this.error = error;
  }
}
