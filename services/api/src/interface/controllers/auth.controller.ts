import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Ip,
  Post,
  UseGuards,
  Headers,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';

import {
  AuthApplicationService,
  DeviceInfo,
} from '../../application/services/auth-application.service';
import {
  SignUpDto,
  SignInDto,
  SocialLoginDto,
  SendOtpDto,
  VerifyOtpDto,
  RefreshTokenDto,
  RequestPasswordResetDto,
  ResetPasswordDto,
  RegisterDeviceDto,
  AuthResponseDto,
  UserProfileDto,
} from '../../application/dto';
import { Public } from '../../infrastructure/security/public.decorator';
import { JwtAuthGuard } from '../../infrastructure/security/jwt-auth.guard';
import { CurrentUser } from '../../infrastructure/security/current-user.decorator';
import { RateLimitGuard } from '../../infrastructure/rate-limiter/rate-limit.guard';

@ApiTags('Auth')
@Controller('auth')
@UseGuards(JwtAuthGuard, RateLimitGuard)
export class AuthController {
  constructor(private readonly authService: AuthApplicationService) {}

  @Public()
  @Post('signup')
  @HttpCode(HttpStatus.CREATED)
  async signUp(
    @Body() dto: SignUpDto,
    @Ip() ip: string,
    @Headers('user-agent') userAgent: string,
  ): Promise<AuthResponseDto> {
    return this.authService.signUp(dto, this.toDeviceInfo(ip, userAgent));
  }

  @Public()
  @Post('signin')
  @HttpCode(HttpStatus.OK)
  async signIn(
    @Body() dto: SignInDto,
    @Ip() ip: string,
    @Headers('user-agent') userAgent: string,
  ): Promise<AuthResponseDto> {
    return this.authService.signIn(dto, this.toDeviceInfo(ip, userAgent));
  }

  @Public()
  @Post('social')
  @HttpCode(HttpStatus.OK)
  async socialLogin(
    @Body() dto: SocialLoginDto,
    @Ip() ip: string,
    @Headers('user-agent') userAgent: string,
  ): Promise<AuthResponseDto> {
    return this.authService.signInSocial(dto, this.toDeviceInfo(ip, userAgent));
  }

  @Public()
  @Post('otp/send')
  @HttpCode(HttpStatus.OK)
  async sendOtp(@Body() dto: SendOtpDto): Promise<{ sent: boolean }> {
    return this.authService.sendOtp(dto);
  }

  @Public()
  @Post('otp/verify')
  @HttpCode(HttpStatus.OK)
  async verifyOtp(
    @Body() dto: VerifyOtpDto,
    @Ip() ip: string,
    @Headers('user-agent') userAgent: string,
  ): Promise<AuthResponseDto> {
    return this.authService.verifyOtp(dto, this.toDeviceInfo(ip, userAgent));
  }

  @Public()
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  async refresh(
    @Body() dto: RefreshTokenDto,
    @Ip() ip: string,
    @Headers('user-agent') userAgent: string,
  ): Promise<AuthResponseDto> {
    return this.authService.refreshToken(dto, this.toDeviceInfo(ip, userAgent));
  }

  @Public()
  @Post('logout')
  @HttpCode(HttpStatus.OK)
  async logout(@Body() dto: RefreshTokenDto): Promise<{ success: boolean }> {
    return this.authService.logout(dto);
  }

  @Public()
  @Post('password-reset/request')
  @HttpCode(HttpStatus.OK)
  async requestPasswordReset(
    @Body() dto: RequestPasswordResetDto,
  ): Promise<{ sent: boolean }> {
    return this.authService.requestPasswordReset(dto);
  }

  @Public()
  @Post('password-reset/confirm')
  @HttpCode(HttpStatus.OK)
  async resetPassword(
    @Body() dto: ResetPasswordDto,
    @Ip() ip: string,
    @Headers('user-agent') userAgent: string,
  ): Promise<AuthResponseDto> {
    return this.authService.resetPassword(
      dto,
      this.toDeviceInfo(ip, userAgent),
    );
  }

  @ApiBearerAuth()
  @Get('me')
  async getProfile(
    @CurrentUser('userId') userId: string,
  ): Promise<UserProfileDto> {
    return this.authService.getProfile(userId);
  }

  @ApiBearerAuth()
  @Post('devices/register')
  @HttpCode(HttpStatus.CREATED)
  async registerDevice(
    @CurrentUser('userId') userId: string,
    @Body() dto: RegisterDeviceDto,
    @Ip() ip: string,
    @Headers('user-agent') userAgent: string,
  ) {
    return this.authService.registerDevice(
      userId,
      dto,
      this.toDeviceInfo(ip, userAgent),
    );
  }

  private toDeviceInfo(ip: string, userAgent: string): DeviceInfo {
    return {
      ipAddress: ip,
      userAgent,
    };
  }
}
