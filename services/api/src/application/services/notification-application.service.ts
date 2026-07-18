import { Inject, Injectable } from '@nestjs/common';
import { Notification } from '../../domain/entities/notification.entity';
import { OutboxEvent } from '../../domain/entities/outbox-event.entity';
import { INotificationRepository } from '../../domain/repositories/notification.repository.interface';
import { IOutboxEventRepository } from '../../domain/repositories/outbox-event.repository.interface';
import { IEmailProvider } from '../../domain/services/email-provider.interface';
import { IPushProvider } from '../../domain/services/push-provider.interface';
import {
  NOTIFICATION_REPOSITORY,
  OUTBOX_EVENT_REPOSITORY,
  EMAIL_PROVIDER,
  PUSH_PROVIDER,
} from '../../domain/constants/injection-tokens';
import { CreateNotificationDto } from '../dto/notification/create-notification.dto';

@Injectable()
export class NotificationApplicationService {
  constructor(
    @Inject(NOTIFICATION_REPOSITORY)
    private readonly notificationRepository: INotificationRepository,
    @Inject(OUTBOX_EVENT_REPOSITORY)
    private readonly outboxRepository: IOutboxEventRepository,
    @Inject(EMAIL_PROVIDER)
    private readonly emailProvider: IEmailProvider,
    @Inject(PUSH_PROVIDER)
    private readonly pushProvider: IPushProvider,
  ) {}

  async createNotification(dto: CreateNotificationDto): Promise<Notification> {
    const notification = new Notification({
      userId: dto.userId!,
      title: dto.title,
      body: dto.body,
      channel: dto.channel,
      type: dto.type,
    });

    const saved = await this.notificationRepository.save(notification);

    const outbox = new OutboxEvent({
      eventType: 'notification_created',
      aggregateType: 'notification',
      aggregateId: saved.id,
      payload: {
        userId: saved.userId,
        notificationId: saved.id,
        channel: saved.channel,
        title: saved.title,
      },
    });
    await this.outboxRepository.save(outbox);

    await this.dispatch(saved);

    outbox.markProcessed();
    await this.outboxRepository.save(outbox);

    return this.notificationRepository.findById(
      saved.id,
    ) as Promise<Notification>;
  }

  async listNotifications(
    userId: string,
    limit = 20,
    offset = 0,
  ): Promise<Notification[]> {
    return this.notificationRepository.findByUserId(userId, limit, offset);
  }

  async dispatch(notification: Notification): Promise<void> {
    try {
      if (notification.channel === 'email') {
        await this.emailProvider.send({
          to: notification.userId,
          subject: notification.title,
          body: notification.body,
        });
      } else if (notification.channel === 'push') {
        await this.pushProvider.send({
          userId: notification.userId,
          title: notification.title,
          body: notification.body,
        });
      }

      notification.markSent();
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : 'Dispatch failed';
      notification.markFailed(message);
    }

    await this.notificationRepository.save(notification);
  }
}
