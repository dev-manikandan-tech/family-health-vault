import { Injectable } from '@nestjs/common';
import { Repository } from 'typeorm';
import { TimelineEvent } from '../../../domain/entities/timeline-event.entity';
import {
  FindTimelineEventsOptions,
  FindTimelineEventsResult,
  ITimelineEventRepository,
} from '../../../domain/repositories/timeline-event.repository.interface';
import { TimelineEventOrmEntity } from '../entities/timeline-event.orm-entity';
import { RlsContextService } from '../../security/rls-context.service';

@Injectable()
export class TypeOrmTimelineEventRepository implements ITimelineEventRepository {
  constructor(private readonly rlsContext: RlsContextService) {}

  async save(event: TimelineEvent): Promise<TimelineEvent> {
    const saved = await this.getRepo().save(this.toOrm(event));
    return this.toDomain(saved);
  }

  async findById(id: string): Promise<TimelineEvent | null> {
    const entity = await this.getRepo().findOne({ where: { id } });
    return entity ? this.toDomain(entity) : null;
  }

  async findBySourceId(sourceId: string): Promise<TimelineEvent | null> {
    const entity = await this.getRepo().findOne({ where: { sourceId } });
    return entity ? this.toDomain(entity) : null;
  }

  async findMany(
    options: FindTimelineEventsOptions,
  ): Promise<FindTimelineEventsResult> {
    const limit = Math.min(options.limit, 100);

    const qb = this.getRepo()
      .createQueryBuilder('e')
      .where('e.patient_profile_id = :profileId', {
        profileId: options.patientProfileId,
      })
      .orderBy('e.event_date', 'DESC')
      .addOrderBy('e.id', 'DESC')
      .take(limit + 1);

    if (options.eventType) {
      qb.andWhere('e.event_type = :eventType', {
        eventType: options.eventType,
      });
    }

    if (options.fromDate) {
      qb.andWhere('e.event_date >= :fromDate', { fromDate: options.fromDate });
    }

    if (options.toDate) {
      qb.andWhere('e.event_date <= :toDate', { toDate: options.toDate });
    }

    if (options.cursor) {
      qb.andWhere(
        '(e.event_date < :cursorDate OR (e.event_date = :cursorDate AND e.id < :cursorId))',
        {
          cursorDate: options.cursor.eventDate,
          cursorId: options.cursor.id,
        },
      );
    }

    const entities = await qb.getMany();

    const hasMore = entities.length > limit;
    const results = hasMore ? entities.slice(0, limit) : entities;
    const next = hasMore ? results[results.length - 1] : undefined;

    return {
      events: results.map((e) => this.toDomain(e)),
      nextCursor: next ? { eventDate: next.eventDate, id: next.id } : undefined,
    };
  }

  async deleteBySourceId(sourceId: string): Promise<void> {
    await this.getRepo().delete({ sourceId });
  }

  private getRepo(): Repository<TimelineEventOrmEntity> {
    return this.rlsContext.getManager().getRepository(TimelineEventOrmEntity);
  }

  private toDomain(entity: TimelineEventOrmEntity): TimelineEvent {
    return new TimelineEvent({
      id: entity.id,
      patientProfileId: entity.patientProfileId,
      familyId: entity.familyId ?? undefined,
      eventType: entity.eventType as TimelineEvent['eventType'],
      eventDate: entity.eventDate,
      title: entity.title,
      description: entity.description ?? undefined,
      sourceId: entity.sourceId ?? undefined,
      sourceType: entity.sourceType ?? undefined,
      metadata: entity.metadata ?? {},
      createdAt: entity.createdAt,
    });
  }

  private toOrm(event: TimelineEvent): TimelineEventOrmEntity {
    const entity = new TimelineEventOrmEntity();
    entity.id = event.id;
    entity.patientProfileId = event.patientProfileId;
    entity.familyId = event.familyId;
    entity.eventType = event.eventType;
    entity.eventDate = event.eventDate;
    entity.title = event.title;
    entity.description = event.description;
    entity.sourceId = event.sourceId;
    entity.sourceType = event.sourceType;
    entity.metadata = event.metadata ?? null;
    entity.createdAt = event.createdAt;
    return entity;
  }
}
