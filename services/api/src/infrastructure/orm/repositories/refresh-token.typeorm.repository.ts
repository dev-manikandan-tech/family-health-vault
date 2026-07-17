import { Injectable } from '@nestjs/common';
import { Repository } from 'typeorm';
import { RefreshToken } from '../../../domain/entities/refresh-token.entity';
import { IRefreshTokenRepository } from '../../../domain/repositories/refresh-token.repository.interface';
import { RefreshTokenOrmEntity } from '../entities/refresh-token.orm-entity';
import { RlsContextService } from '../../security/rls-context.service';

@Injectable()
export class TypeOrmRefreshTokenRepository implements IRefreshTokenRepository {
  constructor(private readonly rlsContext: RlsContextService) {}

  async findByTokenHash(tokenHash: string): Promise<RefreshToken | null> {
    const entity = await this.getRepo().findOne({ where: { tokenHash } });
    return entity ? this.toDomain(entity) : null;
  }

  async save(token: RefreshToken): Promise<RefreshToken> {
    const saved = await this.getRepo().save(this.toOrm(token));
    return this.toDomain(saved);
  }

  async revoke(id: string): Promise<void> {
    await this.getRepo().update(id, { revokedAt: new Date() });
  }

  private getRepo(): Repository<RefreshTokenOrmEntity> {
    return this.rlsContext.getManager().getRepository(RefreshTokenOrmEntity);
  }

  private toDomain(entity: RefreshTokenOrmEntity): RefreshToken {
    return new RefreshToken({
      id: entity.id,
      userId: entity.userId,
      tokenHash: entity.tokenHash,
      expiresAt: entity.expiresAt,
      revokedAt: entity.revokedAt,
      createdAt: entity.createdAt,
    });
  }

  private toOrm(token: RefreshToken): RefreshTokenOrmEntity {
    const entity = new RefreshTokenOrmEntity();
    entity.id = token.id;
    entity.userId = token.userId;
    entity.tokenHash = token.tokenHash;
    entity.expiresAt = token.expiresAt;
    entity.revokedAt = token.revokedAt;
    entity.createdAt = token.createdAt;
    return entity;
  }
}
