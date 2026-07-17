import { Injectable } from '@nestjs/common';
import { Repository } from 'typeorm';
import { DeviceSession } from '../../../domain/entities/device-session.entity';
import { IDeviceSessionRepository } from '../../../domain/repositories/device-session.repository.interface';
import { DeviceSessionOrmEntity } from '../entities/device-session.orm-entity';
import { RlsContextService } from '../../security/rls-context.service';

@Injectable()
export class TypeOrmDeviceSessionRepository implements IDeviceSessionRepository {
  constructor(private readonly rlsContext: RlsContextService) {}

  async findById(id: string): Promise<DeviceSession | null> {
    const entity = await this.getRepo().findOne({ where: { id } });
    return entity ? this.toDomain(entity) : null;
  }

  async save(session: DeviceSession): Promise<DeviceSession> {
    const saved = await this.getRepo().save(this.toOrm(session));
    return this.toDomain(saved);
  }

  private getRepo(): Repository<DeviceSessionOrmEntity> {
    return this.rlsContext.getManager().getRepository(DeviceSessionOrmEntity);
  }

  private toDomain(entity: DeviceSessionOrmEntity): DeviceSession {
    return new DeviceSession({
      id: entity.id,
      userId: entity.userId,
      refreshTokenId: entity.refreshTokenId,
      deviceId: entity.deviceId,
      deviceName: entity.deviceName,
      ipAddress: entity.ipAddress,
      userAgent: entity.userAgent,
      lastActiveAt: entity.lastActiveAt,
      createdAt: entity.createdAt,
    });
  }

  private toOrm(session: DeviceSession): DeviceSessionOrmEntity {
    const entity = new DeviceSessionOrmEntity();
    entity.id = session.id;
    entity.userId = session.userId;
    entity.refreshTokenId = session.refreshTokenId;
    entity.deviceId = session.deviceId;
    entity.deviceName = session.deviceName;
    entity.ipAddress = session.ipAddress;
    entity.userAgent = session.userAgent;
    entity.lastActiveAt = session.lastActiveAt;
    entity.createdAt = session.createdAt;
    return entity;
  }
}
