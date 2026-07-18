import { randomUUID } from 'crypto';

export type TimelineEventType = 'visit' | 'document' | 'extraction';

export interface TimelineEventProps {
  id?: string;
  patientProfileId: string;
  familyId?: string;
  eventType: TimelineEventType;
  eventDate: Date;
  title: string;
  description?: string;
  sourceId?: string;
  sourceType?: string;
  metadata?: Record<string, unknown>;
  createdAt?: Date;
}

export class TimelineEvent {
  id: string;
  patientProfileId: string;
  familyId?: string;
  eventType: TimelineEventType;
  eventDate: Date;
  title: string;
  description?: string;
  sourceId?: string;
  sourceType?: string;
  metadata: Record<string, unknown>;
  createdAt: Date;

  constructor(props: TimelineEventProps) {
    this.id = props.id ?? randomUUID();
    this.patientProfileId = props.patientProfileId;
    this.familyId = props.familyId;
    this.eventType = props.eventType;
    this.eventDate = props.eventDate;
    this.title = props.title;
    this.description = props.description;
    this.sourceId = props.sourceId;
    this.sourceType = props.sourceType;
    this.metadata = props.metadata ?? {};
    this.createdAt = props.createdAt ?? new Date();
  }
}
