import { Body, Controller, Get, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../infrastructure/security/current-user.decorator';
import { SupabaseAuthGuard } from '../../infrastructure/security/supabase-auth.guard';
import { NotificationApplicationService } from '../../application/services/notification-application.service';
import { CreateNotificationDto } from '../../application/dto/notification/create-notification.dto';

@ApiTags('Notifications')
@ApiBearerAuth()
@UseGuards(SupabaseAuthGuard)
@Controller('notifications')
export class NotificationController {
  constructor(
    private readonly notificationService: NotificationApplicationService,
  ) {}

  @Post()
  createNotification(
    @CurrentUser('userId') userId: string,
    @Body() dto: CreateNotificationDto,
  ) {
    // Users can only create notifications addressed to themselves for this MVP.
    return this.notificationService.createNotification({ ...dto, userId });
  }

  @Get()
  listNotifications(
    @CurrentUser('userId') userId: string,
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
  ) {
    return this.notificationService.listNotifications(
      userId,
      limit ? parseInt(limit, 10) : undefined,
      offset ? parseInt(offset, 10) : undefined,
    );
  }
}
