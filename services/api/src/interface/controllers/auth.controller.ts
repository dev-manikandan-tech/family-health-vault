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
import {
  AuthApplicationService,
  DeviceInfo,
} from '../../application/services/auth-application.service';
import {
  RegisterDeviceDto,
  SendPhoneOtpDto,
  VerifyPhoneOtpDto,
  UserProfileDto,
  DeviceSessionDto,
} from '../../application/dto';
import { CurrentUser } from '../../infrastructure/security/current-user.decorator';
import { Public } from '../../infrastructure/security/public.decorator';
import { SupabaseAuthGuard } from '../../infrastructure/security/supabase-auth.guard';

@ApiTags('Auth')
@Controller('auth')
@UseGuards(SupabaseAuthGuard)
export class AuthController {
  constructor(private readonly authService: AuthApplicationService) {}

  @ApiBearerAuth()
  @Get('me')
  async getProfile(
    @CurrentUser('userId') userId: string,
  ): Promise<UserProfileDto> {
    return this.authService.getProfile(userId);
  }

  @ApiBearerAuth()
  @Get('devices')
  async listDevices(
    @CurrentUser('userId') userId: string,
  ): Promise<DeviceSessionDto[]> {
    return this.authService.listDevices(userId);
  }

  @ApiBearerAuth()
  @Post('devices')
  @HttpCode(HttpStatus.CREATED)
  async registerDevice(
    @CurrentUser('userId') userId: string,
    @Body() dto: RegisterDeviceDto,
    @Ip() ip: string,
    @Headers('user-agent') userAgent: string,
    @Headers('x-device-id') deviceId: string,
  ): Promise<DeviceSessionDto> {
    return this.authService.registerDevice(
      userId,
      dto,
      this.toDeviceInfo(ip, userAgent, deviceId),
    );
  }

  @ApiBearerAuth()
  @Delete('devices/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async revokeDevice(
    @CurrentUser('userId') userId: string,
    @Param('id') sessionId: string,
    @Ip() ip: string,
    @Headers('user-agent') userAgent: string,
  ): Promise<void> {
    await this.authService.revokeDevice(
      userId,
      sessionId,
      this.toDeviceInfo(ip, userAgent),
    );
  }

  @ApiBearerAuth()
  @Post('account/delete')
  @HttpCode(HttpStatus.NO_CONTENT)
  async requestAccountDeletion(
    @CurrentUser('userId') userId: string,
    @Ip() ip: string,
    @Headers('user-agent') userAgent: string,
  ): Promise<void> {
    await this.authService.requestAccountDeletion(
      userId,
      this.toDeviceInfo(ip, userAgent),
    );
  }

  @ApiBearerAuth()
  @Post('account/delete/cancel')
  async cancelAccountDeletion(
    @CurrentUser('userId') userId: string,
    @Ip() ip: string,
    @Headers('user-agent') userAgent: string,
  ): Promise<UserProfileDto> {
    return this.authService.cancelAccountDeletion(
      userId,
      this.toDeviceInfo(ip, userAgent),
    );
  }

  @Public()
  @Post('otp/phone/send')
  @HttpCode(HttpStatus.OK)
  async sendPhoneOtp(@Body() dto: SendPhoneOtpDto): Promise<void> {
    return this.authService.sendPhoneOtp(dto);
  }

  @Public()
  @Post('otp/phone/verify')
  @HttpCode(HttpStatus.OK)
  async verifyPhoneOtp(
    @Body() dto: VerifyPhoneOtpDto,
    @Ip() ip: string,
    @Headers('user-agent') userAgent: string,
    @Headers('x-device-id') deviceId: string,
  ): Promise<UserProfileDto> {
    return this.authService.verifyPhoneOtp(
      dto,
      this.toDeviceInfo(ip, userAgent, deviceId),
    );
  }

  private toDeviceInfo(
    ip: string,
    userAgent: string,
    deviceId?: string,
  ): DeviceInfo {
    return {
      ipAddress: ip,
      userAgent,
      deviceId,
    };
  }
}
