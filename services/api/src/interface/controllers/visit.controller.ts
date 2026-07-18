import {
  Body,
  Controller,
  Delete,
  Get,
  Headers,
  HttpCode,
  HttpStatus,
  Ip,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../infrastructure/security/current-user.decorator';
import { SupabaseAuthGuard } from '../../infrastructure/security/supabase-auth.guard';
import { VisitApplicationService } from '../../application/services/visit-application.service';
import { DeviceInfo } from '../../application/services/auth-application.service';
import {
  CreateVisitDto,
  UpdateVisitDto,
  PaginationQueryDto,
} from '../../application/dto';

@ApiTags('Visits')
@ApiBearerAuth()
@UseGuards(SupabaseAuthGuard)
@Controller('profiles/:profileId/visits')
export class VisitController {
  constructor(private readonly visitService: VisitApplicationService) {}

  private toDeviceInfo(ip: string, userAgent: string): DeviceInfo {
    return { ipAddress: ip, userAgent };
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  createVisit(
    @CurrentUser('userId') userId: string,
    @Param('profileId') profileId: string,
    @Body() dto: CreateVisitDto,
    @Ip() ip: string,
    @Headers('user-agent') userAgent: string,
  ) {
    return this.visitService.createVisit(
      userId,
      profileId,
      dto,
      this.toDeviceInfo(ip, userAgent),
    );
  }

  @Get()
  listVisits(
    @CurrentUser('userId') userId: string,
    @Param('profileId') profileId: string,
    @Query() query: PaginationQueryDto,
  ) {
    return this.visitService.listVisits(userId, profileId, query);
  }
}

@ApiTags('Visits')
@ApiBearerAuth()
@UseGuards(SupabaseAuthGuard)
@Controller('visits')
export class VisitDetailController {
  constructor(private readonly visitService: VisitApplicationService) {}

  private toDeviceInfo(ip: string, userAgent: string): DeviceInfo {
    return { ipAddress: ip, userAgent };
  }

  @Get(':id')
  getVisit(@CurrentUser('userId') userId: string, @Param('id') id: string) {
    return this.visitService.getVisit(userId, id);
  }

  @Patch(':id')
  updateVisit(
    @CurrentUser('userId') userId: string,
    @Param('id') id: string,
    @Body() dto: UpdateVisitDto,
    @Ip() ip: string,
    @Headers('user-agent') userAgent: string,
  ) {
    return this.visitService.updateVisit(
      userId,
      id,
      dto,
      this.toDeviceInfo(ip, userAgent),
    );
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  deleteVisit(
    @CurrentUser('userId') userId: string,
    @Param('id') id: string,
    @Ip() ip: string,
    @Headers('user-agent') userAgent: string,
  ) {
    return this.visitService.deleteVisit(
      userId,
      id,
      this.toDeviceInfo(ip, userAgent),
    );
  }

  @Post(':id/restore')
  restoreVisit(
    @CurrentUser('userId') userId: string,
    @Param('id') id: string,
    @Ip() ip: string,
    @Headers('user-agent') userAgent: string,
  ) {
    return this.visitService.restoreVisit(
      userId,
      id,
      this.toDeviceInfo(ip, userAgent),
    );
  }
}
