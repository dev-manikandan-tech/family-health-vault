import { Injectable } from '@nestjs/common';
import { Repository } from 'typeorm';
import { Notification } from '../../../domain/entities/notification.entity';
import { INotificationRepository } from '../../../domain/repositories/notification.repository.interface';
import { NotificationOrmEntity } from '../entities/notification.orm-entity';
import { RlsContextService } from '../../security/rls-context.service';

@Injectable()
export class TypeOrmNotificationRepository implements INotificationRepository {
  constructor(private readonly rlsContext: RlsContextService) {}

  async save(notification: Notification): Promise<Notification> {
    const saved = await this.getRepo().save(this.toOrm(notification));
    return this.toDomain(saved);
  }

  async findById(id: string): Promise<Notification | null> {
    const entity = await this.getRepo().findOne({ where: { id } });
    return entity ? this.toDomain(entity) : null;
  }

  async findByUserId(
    userId: string,
    limit: number,
    offset: number,
  ): Promise<Notification[]> {
    const entities = await this.getRepo().find({
      where: { userId },
      order: { createdAt: 'DESC' },
      take: limit,
      skip: offset,
    });
    return entities.map((e) => this.toDomain(e));
  }

  private getRepo(): Repository<NotificationOrmEntity> {
    return this.rlsContext.getManager().getRepository(NotificationOrmEntity);
  }

  private toDomain(entity: NotificationOrmEntity): Notification {
    return new Notification({
      id: entity.id,
      userId: entity.userId,
      title: entity.title,
      body: entity.body,
      channel: entity.channel as Notification['channel'],
      status: entity.status as Notification['status'],
      type: entity.type ?? undefined,
      scheduledAt: entity.scheduledAt ?? undefined,
      sentAt: entity.sentAt ?? undefined,
      error: entity.error ?? undefined,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
    });
  }

  private toOrm(notification: Notification): NotificationOrmEntity {
    const entity = new NotificationOrmEntity();
    entity.id = notification.id;
    entity.userId = notification.userId;
    entity.title = notification.title;
    entity.body = notification.body;
    entity.channel = notification.channel;
    entity.status = notification.status;
    entity.type = notification.type;
    entity.scheduledAt = notification.scheduledAt;
    entity.sentAt = notification.sentAt;
    entity.error = notification.error;
    entity.createdAt = notification.createdAt;
    entity.updatedAt = notification.updatedAt;
    return entity;
  }
}
