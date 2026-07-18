import { Injectable } from '@nestjs/common';
import { Repository } from 'typeorm';
import { Visit } from '../../../domain/entities/visit.entity';
import { IVisitRepository } from '../../../domain/repositories/visit.repository.interface';
import { VisitOrmEntity } from '../entities/visit.orm-entity';
import { RlsContextService } from '../../security/rls-context.service';

@Injectable()
export class TypeOrmVisitRepository implements IVisitRepository {
  constructor(private readonly rlsContext: RlsContextService) {}

  async findById(id: string): Promise<Visit | null> {
    const entity = await this.getRepo().findOne({
      where: { id },
      withDeleted: true,
    });
    return entity ? this.toDomain(entity) : null;
  }

  async findByPatientProfileId(patientProfileId: string): Promise<Visit[]> {
    const entities = await this.getRepo().find({
      where: { patientProfileId },
      withDeleted: true,
    });
    return entities.map((e) => this.toDomain(e));
  }

  async save(visit: Visit): Promise<Visit> {
    const saved = await this.getRepo().save(this.toOrm(visit));
    return this.toDomain(saved);
  }

  async softDelete(id: string): Promise<void> {
    await this.getRepo().softDelete(id);
  }

  async restore(id: string): Promise<void> {
    await this.getRepo().restore(id);
  }

  private getRepo(): Repository<VisitOrmEntity> {
    return this.rlsContext.getManager().getRepository(VisitOrmEntity);
  }

  private toDomain(entity: VisitOrmEntity): Visit {
    return new Visit({
      id: entity.id,
      patientProfileId: entity.patientProfileId,
      familyId: entity.familyId ?? undefined,
      title: entity.title ?? undefined,
      visitedAt: entity.visitedAt,
      doctorName: entity.doctorName ?? undefined,
      hospitalName: entity.hospitalName ?? undefined,
      diagnosis: entity.diagnosis ?? undefined,
      notes: entity.notes ?? undefined,
      symptoms: entity.symptoms ?? [],
      medications: entity.medications ?? [],
      labTests: entity.labTests ?? [],
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
      deletedAt: entity.deletedAt ?? undefined,
    });
  }

  private toOrm(visit: Visit): VisitOrmEntity {
    const entity = new VisitOrmEntity();
    entity.id = visit.id;
    entity.patientProfileId = visit.patientProfileId;
    entity.familyId = (visit.familyId ?? null) as any;
    entity.title = (visit.title ?? null) as any;
    entity.visitedAt = visit.visitedAt;
    entity.doctorName = (visit.doctorName ?? null) as any;
    entity.hospitalName = (visit.hospitalName ?? null) as any;
    entity.diagnosis = (visit.diagnosis ?? null) as any;
    entity.notes = (visit.notes ?? null) as any;
    entity.symptoms = visit.symptoms ?? [];
    entity.medications = visit.medications ?? [];
    entity.labTests = visit.labTests ?? [];
    entity.createdAt = visit.createdAt;
    entity.updatedAt = visit.updatedAt;
    entity.deletedAt = (visit.deletedAt ?? null) as any;
    return entity;
  }
}
