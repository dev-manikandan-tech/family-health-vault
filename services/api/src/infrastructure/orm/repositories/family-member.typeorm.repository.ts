import { Injectable } from '@nestjs/common';
import { Repository } from 'typeorm';
import {
  FamilyMember,
  FamilyRole,
} from '../../../domain/entities/family-member.entity';
import { IFamilyMemberRepository } from '../../../domain/repositories/family-member.repository.interface';
import { FamilyMemberOrmEntity } from '../entities/family-member.orm-entity';
import { RlsContextService } from '../../security/rls-context.service';

@Injectable()
export class TypeOrmFamilyMemberRepository implements IFamilyMemberRepository {
  constructor(private readonly rlsContext: RlsContextService) {}

  async findById(id: string): Promise<FamilyMember | null> {
    const entity = await this.getRepo().findOne({
      where: { id },
      withDeleted: true,
    });
    return entity ? this.toDomain(entity) : null;
  }

  async findByFamilyId(familyId: string): Promise<FamilyMember[]> {
    const entities = await this.getRepo().find({
      where: { familyId },
      withDeleted: true,
    });
    return entities.map((e) => this.toDomain(e));
  }

  async findByFamilyIdAndUserId(
    familyId: string,
    userId: string,
  ): Promise<FamilyMember | null> {
    const entity = await this.getRepo().findOne({
      where: { familyId, userId },
      withDeleted: true,
    });
    return entity ? this.toDomain(entity) : null;
  }

  async findByUserId(userId: string): Promise<FamilyMember[]> {
    const entities = await this.getRepo().find({
      where: { userId },
      withDeleted: true,
    });
    return entities.map((e) => this.toDomain(e));
  }

  async findByFamilyIdAndEmail(
    familyId: string,
    email: string,
  ): Promise<FamilyMember | null> {
    const entity = await this.getRepo().findOne({
      where: { familyId, email: email.toLowerCase() },
      withDeleted: true,
    });
    return entity ? this.toDomain(entity) : null;
  }

  async findByFamilyIdAndRole(
    familyId: string,
    role: FamilyRole,
  ): Promise<FamilyMember[]> {
    const entities = await this.getRepo().find({
      where: { familyId, role },
      withDeleted: true,
    });
    return entities.map((e) => this.toDomain(e));
  }

  async save(member: FamilyMember): Promise<FamilyMember> {
    const saved = await this.getRepo().save(this.toOrm(member));
    return this.toDomain(saved);
  }

  async softDelete(id: string): Promise<void> {
    await this.getRepo().softDelete(id);
  }

  async softDeleteByFamilyId(familyId: string): Promise<void> {
    await this.getRepo().softDelete({ familyId });
  }

  private getRepo(): Repository<FamilyMemberOrmEntity> {
    return this.rlsContext.getManager().getRepository(FamilyMemberOrmEntity);
  }

  private toDomain(entity: FamilyMemberOrmEntity): FamilyMember {
    return new FamilyMember({
      id: entity.id,
      familyId: entity.familyId,
      userId: entity.userId ?? undefined,
      email: entity.email ?? undefined,
      name: entity.name ?? undefined,
      role: entity.role as FamilyRole,
      joinedAt: entity.joinedAt ?? undefined,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
      deletedAt: entity.deletedAt ?? undefined,
    });
  }

  private toOrm(member: FamilyMember): FamilyMemberOrmEntity {
    const entity = new FamilyMemberOrmEntity();
    entity.id = member.id;
    entity.familyId = member.familyId;
    entity.userId = (member.userId ?? null) as any;
    entity.email = (member.email ?? null) as any;
    entity.name = (member.name ?? null) as any;
    entity.role = member.role;
    entity.joinedAt = (member.joinedAt ?? null) as any;
    entity.createdAt = member.createdAt;
    entity.updatedAt = member.updatedAt;
    entity.deletedAt = (member.deletedAt ?? null) as any;
    return entity;
  }
}
