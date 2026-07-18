import { Injectable } from '@nestjs/common';
import { Repository } from 'typeorm';
import { FamilyInvitation } from '../../../domain/entities/family-invitation.entity';
import { IFamilyInvitationRepository } from '../../../domain/repositories/family-invitation.repository.interface';
import { FamilyInvitationOrmEntity } from '../entities/family-invitation.orm-entity';
import { RlsContextService } from '../../security/rls-context.service';

@Injectable()
export class TypeOrmFamilyInvitationRepository implements IFamilyInvitationRepository {
  constructor(private readonly rlsContext: RlsContextService) {}

  async findById(id: string): Promise<FamilyInvitation | null> {
    const entity = await this.getRepo().findOne({
      where: { id },
      withDeleted: true,
    });
    return entity ? this.toDomain(entity) : null;
  }

  async findByToken(token: string): Promise<FamilyInvitation | null> {
    const entity = await this.getRepo().findOne({
      where: { token },
      withDeleted: true,
    });
    return entity ? this.toDomain(entity) : null;
  }

  async findByFamilyId(familyId: string): Promise<FamilyInvitation[]> {
    const entities = await this.getRepo().find({
      where: { familyId },
      withDeleted: true,
    });
    return entities.map((e) => this.toDomain(e));
  }

  async findPendingByFamilyIdAndEmail(
    familyId: string,
    email: string,
  ): Promise<FamilyInvitation | null> {
    const entity = await this.getRepo().findOne({
      where: { familyId, email: email.toLowerCase(), status: 'pending' },
    });
    return entity ? this.toDomain(entity) : null;
  }

  async save(invitation: FamilyInvitation): Promise<FamilyInvitation> {
    const saved = await this.getRepo().save(this.toOrm(invitation));
    return this.toDomain(saved);
  }

  async softDelete(id: string): Promise<void> {
    await this.getRepo().softDelete(id);
  }

  async softDeleteByFamilyId(familyId: string): Promise<void> {
    await this.getRepo().softDelete({ familyId });
  }

  private getRepo(): Repository<FamilyInvitationOrmEntity> {
    return this.rlsContext
      .getManager()
      .getRepository(FamilyInvitationOrmEntity);
  }

  private toDomain(entity: FamilyInvitationOrmEntity): FamilyInvitation {
    return new FamilyInvitation({
      id: entity.id,
      familyId: entity.familyId,
      email: entity.email,
      role: entity.role,
      token: entity.token,
      invitedBy: entity.invitedBy,
      status: entity.status as any,
      expiresAt: entity.expiresAt,
      acceptedAt: entity.acceptedAt ?? undefined,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
      deletedAt: entity.deletedAt ?? undefined,
    });
  }

  private toOrm(invitation: FamilyInvitation): FamilyInvitationOrmEntity {
    const entity = new FamilyInvitationOrmEntity();
    entity.id = invitation.id;
    entity.familyId = invitation.familyId;
    entity.email = invitation.email;
    entity.role = invitation.role;
    entity.token = invitation.token;
    entity.invitedBy = invitation.invitedBy;
    entity.status = invitation.status;
    entity.expiresAt = invitation.expiresAt;
    entity.acceptedAt = (invitation.acceptedAt ?? null) as any;
    entity.createdAt = invitation.createdAt;
    entity.updatedAt = invitation.updatedAt;
    entity.deletedAt = (invitation.deletedAt ?? null) as any;
    return entity;
  }
}
