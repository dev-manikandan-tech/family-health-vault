import { Injectable } from '@nestjs/common';
import { Repository } from 'typeorm';
import { PatientProfile } from '../../../domain/entities/patient-profile.entity';
import { IPatientProfileRepository } from '../../../domain/repositories/patient-profile.repository.interface';
import { PatientProfileOrmEntity } from '../entities/patient-profile.orm-entity';
import { RlsContextService } from '../../security/rls-context.service';

@Injectable()
export class TypeOrmPatientProfileRepository implements IPatientProfileRepository {
  constructor(private readonly rlsContext: RlsContextService) {}

  async findById(id: string): Promise<PatientProfile | null> {
    const entity = await this.getRepo().findOne({
      where: { id },
      withDeleted: true,
    });
    return entity ? this.toDomain(entity) : null;
  }

  async findByUserId(userId: string): Promise<PatientProfile[]> {
    const entities = await this.getRepo().find({
      where: { userId },
      withDeleted: true,
    });
    return entities.map((e) => this.toDomain(e));
  }

  async findByFamilyId(familyId: string): Promise<PatientProfile[]> {
    const entities = await this.getRepo().find({
      where: { familyId },
      withDeleted: true,
    });
    return entities.map((e) => this.toDomain(e));
  }

  async findByManagedByUserId(userId: string): Promise<PatientProfile[]> {
    const entities = await this.getRepo().find({
      where: { managedByUserId: userId },
      withDeleted: true,
    });
    return entities.map((e) => this.toDomain(e));
  }

  async findByIds(ids: string[]): Promise<PatientProfile[]> {
    const entities = await this.getRepo().find({
      where: ids.map((id) => ({ id })),
      withDeleted: true,
    });
    return entities.map((e) => this.toDomain(e));
  }

  async save(profile: PatientProfile): Promise<PatientProfile> {
    const saved = await this.getRepo().save(this.toOrm(profile));
    return this.toDomain(saved);
  }

  async softDelete(id: string): Promise<void> {
    await this.getRepo().softDelete(id);
  }

  async softDeleteByFamilyId(familyId: string): Promise<void> {
    await this.getRepo().softDelete({ familyId });
  }

  private getRepo(): Repository<PatientProfileOrmEntity> {
    return this.rlsContext.getManager().getRepository(PatientProfileOrmEntity);
  }

  private toDomain(entity: PatientProfileOrmEntity): PatientProfile {
    return new PatientProfile({
      id: entity.id,
      userId: entity.userId ?? undefined,
      familyId: entity.familyId ?? undefined,
      name: entity.name,
      dob: entity.dob ?? undefined,
      sex: entity.sex ?? undefined,
      bloodGroup: entity.bloodGroup ?? undefined,
      allergies: entity.allergies ?? [],
      abhaId: entity.abhaId ?? undefined,
      managedByUserId: entity.managedByUserId ?? undefined,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
      deletedAt: entity.deletedAt ?? undefined,
    });
  }

  private toOrm(profile: PatientProfile): PatientProfileOrmEntity {
    const entity = new PatientProfileOrmEntity();
    entity.id = profile.id;
    entity.userId = (profile.userId ?? null) as any;
    entity.familyId = (profile.familyId ?? null) as any;
    entity.name = profile.name;
    entity.dob = (profile.dob ?? null) as any;
    entity.sex = (profile.sex ?? null) as any;
    entity.bloodGroup = (profile.bloodGroup ?? null) as any;
    entity.allergies = profile.allergies ?? [];
    entity.abhaId = (profile.abhaId ?? null) as any;
    entity.managedByUserId = (profile.managedByUserId ?? null) as any;
    entity.createdAt = profile.createdAt;
    entity.updatedAt = profile.updatedAt;
    entity.deletedAt = (profile.deletedAt ?? null) as any;
    return entity;
  }
}
