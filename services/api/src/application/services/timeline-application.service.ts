import { Inject, Injectable } from '@nestjs/common';
import { Visit } from '../../domain/entities/visit.entity';
import { Document } from '../../domain/entities/document.entity';
import { TimelineEvent } from '../../domain/entities/timeline-event.entity';
import {
  ITimelineEventRepository,
  FindTimelineEventsResult,
} from '../../domain/repositories/timeline-event.repository.interface';
import { IPatientProfileRepository } from '../../domain/repositories/patient-profile.repository.interface';
import { AuthorizationService } from './authorization.service';
import { IPdfGenerator } from '../../domain/services/pdf-generator.interface';
import {
  PATIENT_PROFILE_REPOSITORY,
  TIMELINE_EVENT_REPOSITORY,
  PDF_GENERATOR,
} from '../../domain/constants/injection-tokens';
import { AuthError, AuthErrorCode } from '../../domain/errors/auth.error';

export interface TimelineQueryOptions {
  eventType?: string;
  fromDate?: string;
  toDate?: string;
  cursor?: string;
  limit?: number;
}

@Injectable()
export class TimelineApplicationService {
  constructor(
    @Inject(TIMELINE_EVENT_REPOSITORY)
    private readonly timelineRepository: ITimelineEventRepository,
    @Inject(PATIENT_PROFILE_REPOSITORY)
    private readonly profileRepository: IPatientProfileRepository,
    private readonly authorizationService: AuthorizationService,
    @Inject(PDF_GENERATOR)
    private readonly pdfGenerator: IPdfGenerator,
  ) {}

  async recordVisit(visit: Visit): Promise<void> {
    const profile = await this.profileRepository.findById(
      visit.patientProfileId,
    );
    const title = `${visit.hospitalName ?? 'Visit'}${visit.doctorName ? ` - ${visit.doctorName}` : ''}`;
    const event = new TimelineEvent({
      patientProfileId: visit.patientProfileId,
      familyId: profile?.familyId,
      eventType: 'visit',
      eventDate: visit.visitedAt,
      title,
      description: visit.diagnosis,
      sourceId: visit.id,
      sourceType: 'visit',
      metadata: {
        doctorName: visit.doctorName,
        hospitalName: visit.hospitalName,
        diagnosis: visit.diagnosis,
      },
    });

    const existing = await this.timelineRepository.findBySourceId(visit.id);
    if (existing) {
      event.id = existing.id;
      event.createdAt = existing.createdAt;
    }
    await this.timelineRepository.save(event);
  }

  async recordDocument(document: Document): Promise<void> {
    const profile = await this.profileRepository.findById(
      document.patientProfileId,
    );
    const event = new TimelineEvent({
      patientProfileId: document.patientProfileId,
      familyId: document.familyId ?? profile?.familyId,
      eventType: 'document',
      eventDate: document.createdAt,
      title: document.originalName ?? 'Document uploaded',
      description: document.extractedEntities?.documentType,
      sourceId: document.id,
      sourceType: 'document',
      metadata: {
        contentType: document.contentType,
        documentType: document.extractedEntities?.documentType,
      },
    });

    const existing = await this.timelineRepository.findBySourceId(document.id);
    if (existing) {
      event.id = existing.id;
      event.createdAt = existing.createdAt;
    }
    await this.timelineRepository.save(event);
  }

  async recordExtraction(document: Document): Promise<void> {
    if (!document.extractedEntities) return;
    const profile = await this.profileRepository.findById(
      document.patientProfileId,
    );
    const event = new TimelineEvent({
      patientProfileId: document.patientProfileId,
      familyId: document.familyId ?? profile?.familyId,
      eventType: 'extraction',
      eventDate: document.extractedAt ?? new Date(),
      title: `Extraction ready - ${document.extractedEntities.documentType}`,
      description: document.extractedEntities.rawText?.slice(0, 200),
      sourceId: document.id,
      sourceType: 'document',
      metadata: {
        documentType: document.extractedEntities.documentType,
        confidence: document.extractionConfidence,
      },
    });
    await this.timelineRepository.save(event);
  }

  async getTimeline(
    userId: string,
    profileId: string,
    options: TimelineQueryOptions,
  ): Promise<FindTimelineEventsResult> {
    await this.requireAccess(userId, profileId);

    const limit = options.limit ?? 20;
    let cursor: { eventDate: Date; id: string } | undefined;
    if (options.cursor) {
      const [date, id] = options.cursor.split('|');
      cursor = { eventDate: new Date(date), id };
    }

    return this.timelineRepository.findMany({
      patientProfileId: profileId,
      eventType: options.eventType,
      fromDate: options.fromDate ? new Date(options.fromDate) : undefined,
      toDate: options.toDate ? new Date(options.toDate) : undefined,
      cursor,
      limit,
    });
  }

  async exportTimelinePdf(
    userId: string,
    profileId: string,
  ): Promise<{ buffer: Buffer; filename: string }> {
    await this.requireAccess(userId, profileId);

    const profile = await this.profileRepository.findById(profileId);
    if (!profile) {
      throw new AuthError(AuthErrorCode.PROFILE_NOT_FOUND, 'Profile not found');
    }

    const { events } = await this.timelineRepository.findMany({
      patientProfileId: profileId,
      limit: 1000,
    });

    const buffer = await this.pdfGenerator.generateTimelinePdf(
      profile.name,
      events,
    );
    const filename = `timeline-${profile.name.replace(/\s+/g, '_')}-${new Date().toISOString().split('T')[0]}.pdf`;

    return { buffer, filename };
  }

  private async requireAccess(
    userId: string,
    profileId: string,
  ): Promise<void> {
    const canManage = await this.authorizationService.canManageProfile(
      userId,
      profileId,
    );
    const hasGrant = await this.authorizationService.canAccessProfile(
      userId,
      profileId,
      'visits_only',
    );
    if (!canManage && !hasGrant) {
      throw new AuthError(AuthErrorCode.UNAUTHORIZED, 'Forbidden');
    }
  }
}
