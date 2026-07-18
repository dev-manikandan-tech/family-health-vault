import { Injectable } from '@nestjs/common';
import { Repository } from 'typeorm';
import { OutboxEvent } from '../../../domain/entities/outbox-event.entity';
import { IOutboxEventRepository } from '../../../domain/repositories/outbox-event.repository.interface';
import { OutboxEventOrmEntity } from '../entities/outbox-event.orm-entity';
import { RlsContextService } from '../../security/rls-context.service';

@Injectable()
export class TypeOrmOutboxEventRepository implements IOutboxEventRepository {
  constructor(private readonly rlsContext: RlsContextService) {}

  async save(event: OutboxEvent): Promise<OutboxEvent> {
    const saved = await this.getRepo().save(this.toOrm(event));
    return this.toDomain(saved);
  }

  async findPending(limit: number): Promise<OutboxEvent[]> {
    const entities = await this.getRepo().find({
      where: { status: 'pending' },
      order: { createdAt: 'ASC' },
      take: limit,
    });
    return entities.map((e) => this.toDomain(e));
  }

  private getRepo(): Repository<OutboxEventOrmEntity> {
    return this.rlsContext.getManager().getRepository(OutboxEventOrmEntity);
  }

  private toDomain(entity: OutboxEventOrmEntity): OutboxEvent {
    return new OutboxEvent({
      id: entity.id,
      eventType: entity.eventType,
      aggregateType: entity.aggregateType,
      aggregateId: entity.aggregateId,
      payload: entity.payload ?? {},
      status: entity.status as OutboxEvent['status'],
      createdAt: entity.createdAt,
      processedAt: entity.processedAt ?? undefined,
      error: entity.error ?? undefined,
    });
  }

  private toOrm(event: OutboxEvent): OutboxEventOrmEntity {
    const entity = new OutboxEventOrmEntity();
    entity.id = event.id;
    entity.eventType = event.eventType;
    entity.aggregateType = event.aggregateType;
    entity.aggregateId = event.aggregateId;
    entity.payload = event.payload;
    entity.status = event.status;
    entity.createdAt = event.createdAt;
    entity.processedAt = event.processedAt;
    entity.error = event.error;
    return entity;
  }
}
