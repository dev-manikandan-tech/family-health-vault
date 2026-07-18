import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from './auth.module';
import { DatabaseModule } from '../database/database.module';
import { NotificationOrmEntity } from '../orm/entities/notification.orm-entity';
import { OutboxEventOrmEntity } from '../orm/entities/outbox-event.orm-entity';
import { TypeOrmNotificationRepository } from '../orm/repositories/notification.typeorm.repository';
import { TypeOrmOutboxEventRepository } from '../orm/repositories/outbox-event.typeorm.repository';
import { NotificationApplicationService } from '../../application/services/notification-application.service';
import { NotificationController } from '../../interface/controllers/notification.controller';
import { ConsoleEmailProvider } from '../notifications/console-email.provider';
import { ConsolePushProvider } from '../notifications/console-push.provider';
import {
  NOTIFICATION_REPOSITORY,
  OUTBOX_EVENT_REPOSITORY,
  EMAIL_PROVIDER,
  PUSH_PROVIDER,
} from '../../domain/constants/injection-tokens';

@Module({
  imports: [
    AuthModule,
    DatabaseModule,
    TypeOrmModule.forFeature([NotificationOrmEntity, OutboxEventOrmEntity]),
  ],
  controllers: [NotificationController],
  providers: [
    NotificationApplicationService,
    {
      provide: NOTIFICATION_REPOSITORY,
      useClass: TypeOrmNotificationRepository,
    },
    {
      provide: OUTBOX_EVENT_REPOSITORY,
      useClass: TypeOrmOutboxEventRepository,
    },
    { provide: EMAIL_PROVIDER, useClass: ConsoleEmailProvider },
    { provide: PUSH_PROVIDER, useClass: ConsolePushProvider },
  ],
})
export class NotificationModule {}
