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
    const entity = await this.getRepo().findOne({ where: { id } });
    return entity ? this.toDomain(entity) : null;
  }

  async findByEmail(email: string): Promise<User | null> {
    const entity = await this.getRepo().findOne({
      where: { email: email.toLowerCase() },
    });
    return entity ? this.toDomain(entity) : null;
  }

  async save(user: User): Promise<User> {
    const entity = this.toOrm(user);
    const saved = await this.getRepo().save(entity);
    return this.toDomain(saved);
  }

  private getRepo(): Repository<UserOrmEntity> {
    return this.rlsContext.getManager().getRepository(UserOrmEntity);
  }

  private toDomain(entity: UserOrmEntity): User {
    return new User({
      id: entity.id,
      email: entity.email,
      passwordHash: entity.passwordHash,
      authProvider: entity.authProvider as any,
      providerUserId: entity.providerUserId,
      emailVerified: entity.emailVerified,
      mfaEnabled: entity.mfaEnabled,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
      deletedAt: entity.deletedAt,
    });
  }

  private toOrm(user: User): UserOrmEntity {
    const entity = new UserOrmEntity();
    entity.id = user.id;
    entity.email = user.email;
    entity.passwordHash = user.passwordHash;
    entity.authProvider = user.authProvider;
    entity.providerUserId = user.providerUserId;
    entity.emailVerified = user.emailVerified;
    entity.mfaEnabled = user.mfaEnabled;
    entity.createdAt = user.createdAt;
    entity.updatedAt = user.updatedAt;
    entity.deletedAt = user.deletedAt;
    return entity;
  }
}
