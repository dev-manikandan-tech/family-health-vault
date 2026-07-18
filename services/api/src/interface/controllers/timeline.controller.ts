import {
  Controller,
  Get,
  Param,
  Query,
  UseGuards,
  Res,
  HttpStatus,
} from '@nestjs/common';
import { Response } from 'express';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../infrastructure/security/current-user.decorator';
import { SupabaseAuthGuard } from '../../infrastructure/security/supabase-auth.guard';
import { TimelineApplicationService } from '../../application/services/timeline-application.service';

@Controller('profiles/:profileId/timeline')
@ApiTags('Timeline')
@ApiBearerAuth()
@UseGuards(SupabaseAuthGuard)
export class TimelineController {
  constructor(private readonly timelineService: TimelineApplicationService) {}

  @Get()
  async getTimeline(
    @CurrentUser('userId') userId: string,
    @Param('profileId') profileId: string,
    @Query('eventType') eventType?: string,
    @Query('fromDate') fromDate?: string,
    @Query('toDate') toDate?: string,
    @Query('cursor') cursor?: string,
    @Query('limit') limit?: string,
  ) {
    return this.timelineService.getTimeline(userId, profileId, {
      eventType,
      fromDate,
      toDate,
      cursor,
      limit: limit ? parseInt(limit, 10) : undefined,
    });
  }

  @Get('export.pdf')
  async exportPdf(
    @CurrentUser('userId') userId: string,
    @Param('profileId') profileId: string,
    @Res() res: Response,
  ) {
    const { buffer, filename } = await this.timelineService.exportTimelinePdf(
      userId,
      profileId,
    );
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.status(HttpStatus.OK).send(buffer);
  }
}
