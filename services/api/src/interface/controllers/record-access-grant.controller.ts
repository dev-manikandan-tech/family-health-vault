import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Ip,
  Param,
  Post,
  Headers,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { RecordAccessGrantApplicationService } from '../../application/services/record-access-grant-application.service';
import { CurrentUser } from '../../infrastructure/security/current-user.decorator';
import { SupabaseAuthGuard } from '../../infrastructure/security/supabase-auth.guard';
import {
  CreateRecordAccessGrantDto,
  RecordAccessGrantResponseDto,
} from '../../application/dto';

@ApiTags('Record Access Grants')
@Controller('profiles/:profileId/grants')
@UseGuards(SupabaseAuthGuard)
export class RecordAccessGrantController {
  constructor(
    private readonly grantService: RecordAccessGrantApplicationService,
  ) {}

  @ApiBearerAuth()
  @Post()
  @HttpCode(HttpStatus.CREATED)
  async createGrant(
    @CurrentUser('userId') userId: string,
    @Param('profileId') profileId: string,
    @Body() dto: CreateRecordAccessGrantDto,
    @Ip() ip: string,
    @Headers('user-agent') userAgent: string,
  ): Promise<RecordAccessGrantResponseDto> {
    return this.grantService.createGrant(userId, profileId, dto, {
      ipAddress: ip,
      userAgent,
    });
  }

  @ApiBearerAuth()
  @Get()
  async listGrants(
    @CurrentUser('userId') userId: string,
    @Param('profileId') profileId: string,
  ): Promise<RecordAccessGrantResponseDto[]> {
    return this.grantService.listGrants(userId, profileId);
  }

  @ApiBearerAuth()
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async revokeGrant(
    @CurrentUser('userId') userId: string,
    @Param('id') grantId: string,
    @Ip() ip: string,
    @Headers('user-agent') userAgent: string,
  ): Promise<void> {
    return this.grantService.revokeGrant(userId, grantId, {
      ipAddress: ip,
      userAgent,
    });
  }
}
