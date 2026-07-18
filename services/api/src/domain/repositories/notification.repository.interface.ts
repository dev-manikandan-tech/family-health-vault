import { Notification } from '../entities/notification.entity';

export interface INotificationRepository {
  save(notification: Notification): Promise<Notification>;
  findById(id: string): Promise<Notification | null>;
  findByUserId(
    userId: string,
    limit: number,
    offset: number,
  ): Promise<Notification[]>;
}
