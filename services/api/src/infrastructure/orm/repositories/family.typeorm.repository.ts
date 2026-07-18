import { Injectable } from '@nestjs/common';
import { Repository, In } from 'typeorm';
import { Family } from '../../../domain/entities/family.entity';
import { IFamilyRepository } from '../../../domain/repositories/family.repository.interface';
import { FamilyOrmEntity } from '../entities/family.orm-entity';
import { RlsContextService } from '../../security/rls-context.service';

@Injectable()
export class TypeOrmFamilyRepository implements IFamilyRepository {
  constructor(private readonly rlsContext: RlsContextService) {}

  async findById(id: string): Promise<Family | null> {
    const entity = await this.getRepo().findOne({
      where: { id },
      withDeleted: true,
    });
    return entity ? this.toDomain(entity) : null;
  }

  async findByIds(ids: string[]): Promise<Family[]> {
    const entities = await this.getRepo().find({
      where: { id: In(ids) },
      withDeleted: true,
    });
    return entities.map((e) => this.toDomain(e));
  }

  async findByCreatedBy(userId: string): Promise<Family[]> {
    const entities = await this.getRepo().find({
      where: { createdBy: userId },
      withDeleted: true,
    });
    return entities.map((e) => this.toDomain(e));
  }

  async save(family: Family): Promise<Family> {
    const saved = await this.getRepo().save(this.toOrm(family));
    return this.toDomain(saved);
  }

  async softDelete(id: string): Promise<void> {
    await this.getRepo().softDelete(id);
  }

  private getRepo(): Repository<FamilyOrmEntity> {
    return this.rlsContext.getManager().getRepository(FamilyOrmEntity);
  }

  private toDomain(entity: FamilyOrmEntity): Family {
    return new Family({
      id: entity.id,
      name: entity.name,
      createdBy: entity.createdBy,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
      deletedAt: entity.deletedAt ?? undefined,
    });
  }

  private toOrm(family: Family): FamilyOrmEntity {
    const entity = new FamilyOrmEntity();
    entity.id = family.id;
    entity.name = family.name;
    entity.createdBy = family.createdBy;
    entity.createdAt = family.createdAt;
    entity.updatedAt = family.updatedAt;
    entity.deletedAt = family.deletedAt;
    return entity;
  }
}
