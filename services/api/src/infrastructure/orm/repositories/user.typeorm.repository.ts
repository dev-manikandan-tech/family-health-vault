import { Injectable } from '@nestjs/common';
import { Repository } from 'typeorm';
import { User } from '../../../domain/entities/user.entity';
import { IUserRepository } from '../../../domain/repositories/user.repository.interface';
import { UserOrmEntity } from '../entities/user.orm-entity';
import { RlsContextService } from '../../security/rls-context.service';

@Injectable()
export class TypeOrmUserRepository implements IUserRepository {
  constructor(private readonly rlsContext: RlsContextService) {}

  async findById(id: string): Promise<User | null> {
    const entity = await this.getRepo().findOne({
      where: { id },
      withDeleted: true,
    });
    return entity ? this.toDomain(entity) : null;
  }

  async findByEmail(email: string): Promise<User | null> {
    const entity = await this.getRepo().findOne({
      where: { email: email.toLowerCase() },
      withDeleted: true,
    });
    return entity ? this.toDomain(entity) : null;
  }

  async save(user: User): Promise<User> {
    const saved = await this.getRepo().save(this.toOrm(user));
    return this.toDomain(saved);
  }

  private getRepo(): Repository<UserOrmEntity> {
    return this.rlsContext.getManager().getRepository(UserOrmEntity);
  }

  private toDomain(entity: UserOrmEntity): User {
    return new User({
      id: entity.id,
      email: entity.email,
      phone: entity.phone,
      authProvider: entity.authProvider as any,
      providerUserId: entity.providerUserId,
      emailVerified: entity.emailVerified,
      phoneVerified: entity.phoneVerified,
      mfaEnabled: entity.mfaEnabled,
      deletionRequestedAt: entity.deletionRequestedAt,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
      deletedAt: entity.deletedAt,
    });
  }

  private toOrm(user: User): UserOrmEntity {
    const entity = new UserOrmEntity();
    entity.id = user.id;
    entity.email = user.email;
    entity.phone = user.phone;
    entity.authProvider = user.authProvider;
    entity.providerUserId = user.providerUserId;
    entity.emailVerified = user.emailVerified;
    entity.phoneVerified = user.phoneVerified;
    entity.mfaEnabled = user.mfaEnabled;
    entity.deletionRequestedAt = user.deletionRequestedAt;
    entity.createdAt = user.createdAt;
    entity.updatedAt = user.updatedAt;
    entity.deletedAt = user.deletedAt;
    return entity;
  }
}
