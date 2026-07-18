import { TimelineEvent } from '../entities/timeline-event.entity';

export interface FindTimelineEventsOptions {
  patientProfileId: string;
  eventType?: string;
  fromDate?: Date;
  toDate?: Date;
  cursor?: { eventDate: Date; id: string };
  limit: number;
}

export interface FindTimelineEventsResult {
  events: TimelineEvent[];
  nextCursor?: { eventDate: Date; id: string };
}

export interface ITimelineEventRepository {
  save(event: TimelineEvent): Promise<TimelineEvent>;
  findById(id: string): Promise<TimelineEvent | null>;
  findBySourceId(sourceId: string): Promise<TimelineEvent | null>;
  findMany(
    options: FindTimelineEventsOptions,
  ): Promise<FindTimelineEventsResult>;
  deleteBySourceId(sourceId: string): Promise<void>;
}
