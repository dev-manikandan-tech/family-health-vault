import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Ip,
  Param,
  Patch,
  Post,
  Headers,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { PatientProfileApplicationService } from '../../application/services/patient-profile-application.service';
import { CurrentUser } from '../../infrastructure/security/current-user.decorator';
import { SupabaseAuthGuard } from '../../infrastructure/security/supabase-auth.guard';
import {
  CreatePatientProfileDto,
  PaginationQueryDto,
  PatientProfileResponseDto,
  UpdatePatientProfileDto,
} from '../../application/dto';

@ApiTags('Patient Profiles')
@Controller('profiles')
@UseGuards(SupabaseAuthGuard)
export class PatientProfileController {
  constructor(
    private readonly profileService: PatientProfileApplicationService,
  ) {}

  @ApiBearerAuth()
  @Post()
  @HttpCode(HttpStatus.CREATED)
  async createProfile(
    @CurrentUser('userId') userId: string,
    @Body() dto: CreatePatientProfileDto,
    @Ip() ip: string,
    @Headers('user-agent') userAgent: string,
  ): Promise<PatientProfileResponseDto> {
    return this.profileService.createProfile(userId, dto, {
      ipAddress: ip,
      userAgent,
    });
  }

  @ApiBearerAuth()
  @Get()
  async listProfiles(
    @CurrentUser('userId') userId: string,
    @Query() query: PaginationQueryDto,
  ): Promise<{ data: PatientProfileResponseDto[]; total: number }> {
    return this.profileService.listProfiles(userId, query);
  }

  @ApiBearerAuth()
  @Get(':id')
  async getProfile(
    @CurrentUser('userId') userId: string,
    @Param('id') profileId: string,
  ): Promise<PatientProfileResponseDto> {
    return this.profileService.getProfile(userId, profileId);
  }

  @ApiBearerAuth()
  @Patch(':id')
  async updateProfile(
    @CurrentUser('userId') userId: string,
    @Param('id') profileId: string,
    @Body() dto: UpdatePatientProfileDto,
    @Ip() ip: string,
    @Headers('user-agent') userAgent: string,
  ): Promise<PatientProfileResponseDto> {
    return this.profileService.updateProfile(userId, profileId, dto, {
      ipAddress: ip,
      userAgent,
    });
  }

  @ApiBearerAuth()
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteProfile(
    @CurrentUser('userId') userId: string,
    @Param('id') profileId: string,
    @Ip() ip: string,
    @Headers('user-agent') userAgent: string,
  ): Promise<void> {
    return this.profileService.deleteProfile(userId, profileId, {
      ipAddress: ip,
      userAgent,
    });
  }
}
