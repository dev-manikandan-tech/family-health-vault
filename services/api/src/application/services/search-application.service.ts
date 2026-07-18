import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { AuthorizationService } from './authorization.service';
import { VisitOrmEntity } from '../../infrastructure/orm/entities/visit.orm-entity';
import { DocumentOrmEntity } from '../../infrastructure/orm/entities/document.orm-entity';

export interface SearchHit {
  type: 'visit' | 'document';
  id: string;
  patientProfileId: string;
  title?: string;
  matchedField: string;
  matchedValue: string;
  eventDate: Date;
}

export interface SearchOptions {
  limit?: number;
  offset?: number;
  profileId?: string;
}

@Injectable()
export class SearchApplicationService {
  constructor(
    private readonly dataSource: DataSource,
    private readonly authorizationService: AuthorizationService,
  ) {}

  async search(
    userId: string,
    query: string,
    options: SearchOptions = {},
  ): Promise<SearchHit[]> {
    const profileIds = await this.getProfileIds(userId, options.profileId);
    if (profileIds.length === 0) return [];

    const term = `%${query.toLowerCase()}%`;
    const limit = options.limit ?? 20;
    const offset = options.offset ?? 0;

    const visits = await this.dataSource
      .getRepository(VisitOrmEntity)
      .createQueryBuilder('v')
      .where('v.patient_profile_id IN (:...ids)', { ids: profileIds })
      .andWhere(
        `(LOWER(v.title) LIKE :term
        OR LOWER(v.doctor_name) LIKE :term
        OR LOWER(v.hospital_name) LIKE :term
        OR LOWER(v.diagnosis) LIKE :term
        OR LOWER(v.notes) LIKE :term)`,
        { term },
      )
      .andWhere('v.deleted_at IS NULL')
      .orderBy('v.visited_at', 'DESC')
      .limit(limit)
      .offset(offset)
      .getMany();

    const documents = await this.dataSource
      .getRepository(DocumentOrmEntity)
      .createQueryBuilder('d')
      .where('d.patient_profile_id IN (:...ids)', { ids: profileIds })
      .andWhere(
        `(LOWER(d.original_name) LIKE :term
        OR LOWER(d.processing_error) LIKE :term
        OR LOWER(d.extraction_error) LIKE :term
        OR LOWER(d.extracted_metadata) LIKE :term
        OR LOWER(d.extracted_entities) LIKE :term)`,
        { term },
      )
      .andWhere('d.deleted_at IS NULL')
      .orderBy('d.created_at', 'DESC')
      .limit(limit)
      .offset(offset)
      .getMany();

    const hits: SearchHit[] = [
      ...visits.map((v) => ({
        type: 'visit' as const,
        id: v.id,
        patientProfileId: v.patientProfileId,
        title: v.title ?? `${v.hospitalName ?? 'Visit'}`,
        matchedField: 'diagnosis',
        matchedValue: v.diagnosis ?? '',
        eventDate: v.visitedAt,
      })),
      ...documents.map((d) => ({
        type: 'document' as const,
        id: d.id,
        patientProfileId: d.patientProfileId,
        title: d.originalName ?? 'Document',
        matchedField: 'originalName',
        matchedValue: d.originalName ?? '',
        eventDate: d.createdAt,
      })),
    ];

    return hits
      .sort((a, b) => b.eventDate.getTime() - a.eventDate.getTime())
      .slice(0, limit);
  }

  async autocomplete(
    userId: string,
    query: string,
    options: SearchOptions = {},
  ): Promise<string[]> {
    const profileIds = await this.getProfileIds(userId, options.profileId);
    if (profileIds.length === 0 || query.length < 2) return [];

    const term = `%${query.toLowerCase()}%`;
    const limit = options.limit ?? 10;

    const visits = await this.dataSource
      .getRepository(VisitOrmEntity)
      .createQueryBuilder('v')
      .select([
        'v.doctor_name AS doctorName',
        'v.hospital_name AS hospitalName',
        'v.diagnosis AS diagnosis',
      ])
      .where('v.patient_profile_id IN (:...ids)', { ids: profileIds })
      .andWhere(
        `(LOWER(v.doctor_name) LIKE :term
        OR LOWER(v.hospital_name) LIKE :term
        OR LOWER(v.diagnosis) LIKE :term)`,
        { term },
      )
      .andWhere('v.deleted_at IS NULL')
      .limit(limit)
      .getRawMany();

    const suggestions = new Set<string>();
    for (const v of visits) {
      for (const field of ['doctorName', 'hospitalName', 'diagnosis']) {
        const value = v[field];
        if (
          typeof value === 'string' &&
          value.toLowerCase().includes(query.toLowerCase())
        ) {
          suggestions.add(value);
        }
      }
    }

    return [...suggestions].slice(0, limit);
  }

  private async getProfileIds(
    userId: string,
    profileId?: string,
  ): Promise<string[]> {
    if (profileId) {
      const allowed = await this.authorizationService.canAccessProfile(
        userId,
        profileId,
        'visits_only',
      );
      return allowed ? [profileId] : [];
    }
    return this.authorizationService.getAccessibleProfileIds(userId);
  }
}
