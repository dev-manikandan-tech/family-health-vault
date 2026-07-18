import { randomUUID } from 'crypto';

export type NotificationChannel = 'in_app' | 'email' | 'push';
export type NotificationStatus = 'pending' | 'sent' | 'failed';

export interface NotificationProps {
  id?: string;
  userId: string;
  title: string;
  body: string;
  channel: NotificationChannel;
  status?: NotificationStatus;
  type?: string;
  scheduledAt?: Date;
  sentAt?: Date;
  error?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export class Notification {
  id: string;
  userId: string;
  title: string;
  body: string;
  channel: NotificationChannel;
  status: NotificationStatus;
  type?: string;
  scheduledAt?: Date;
  sentAt?: Date;
  error?: string;
  createdAt: Date;
  updatedAt: Date;

  constructor(props: NotificationProps) {
    this.id = props.id ?? randomUUID();
    this.userId = props.userId;
    this.title = props.title;
    this.body = props.body;
    this.channel = props.channel;
    this.status = props.status ?? 'pending';
    this.type = props.type;
    this.scheduledAt = props.scheduledAt;
    this.sentAt = props.sentAt;
    this.error = props.error;
    this.createdAt = props.createdAt ?? new Date();
    this.updatedAt = props.updatedAt ?? new Date();
  }

  markSent(): void {
    this.status = 'sent';
    this.sentAt = new Date();
    this.updatedAt = new Date();
  }

  markFailed(error: string): void {
    this.status = 'failed';
    this.error = error;
    this.updatedAt = new Date();
  }
}
