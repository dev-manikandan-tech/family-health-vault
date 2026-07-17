import { Inject, Injectable } from '@nestjs/common';
import { User } from '../../domain/entities/user.entity';
import { RefreshToken } from '../../domain/entities/refresh-token.entity';
import { DeviceSession } from '../../domain/entities/device-session.entity';
import { AuthError, AuthErrorCode } from '../../domain/errors/auth.error';
import { IUserRepository } from '../../domain/repositories/user.repository.interface';
import { IRefreshTokenRepository } from '../../domain/repositories/refresh-token.repository.interface';
import { IDeviceSessionRepository } from '../../domain/repositories/device-session.repository.interface';
import { IPasswordHasher } from '../../domain/services/password-hasher.interface';
import { ITokenService } from '../../domain/services/token-service.interface';
import { IIdentityProvider } from '../../domain/services/identity-provider.interface';
import { IOtpService } from '../../domain/services/otp-service.interface';
import { IPasswordResetService } from '../../domain/services/password-reset-service.interface';
import { IEmailSender } from '../../domain/services/email-sender.interface';
import {
  USER_REPOSITORY,
  REFRESH_TOKEN_REPOSITORY,
  DEVICE_SESSION_REPOSITORY,
  PASSWORD_HASHER,
  TOKEN_SERVICE,
  IDENTITY_PROVIDER,
  OTP_SERVICE,
  PASSWORD_RESET_SERVICE,
  EMAIL_SENDER,
} from '../../domain/constants/injection-tokens';
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
} from '../dto';

export interface DeviceInfo {
  deviceId?: string;
  deviceName?: string;
  ipAddress?: string;
  userAgent?: string;
}

@Injectable()
export class AuthApplicationService {
  constructor(
    @Inject(USER_REPOSITORY)
    private readonly userRepository: IUserRepository,
    @Inject(REFRESH_TOKEN_REPOSITORY)
    private readonly refreshTokenRepository: IRefreshTokenRepository,
    @Inject(DEVICE_SESSION_REPOSITORY)
    private readonly deviceSessionRepository: IDeviceSessionRepository,
    @Inject(PASSWORD_HASHER)
    private readonly passwordHasher: IPasswordHasher,
    @Inject(TOKEN_SERVICE)
    private readonly tokenService: ITokenService,
    @Inject(IDENTITY_PROVIDER)
    private readonly identityProvider: IIdentityProvider,
    @Inject(OTP_SERVICE)
    private readonly otpService: IOtpService,
    @Inject(PASSWORD_RESET_SERVICE)
    private readonly passwordResetService: IPasswordResetService,
    @Inject(EMAIL_SENDER)
    private readonly emailSender: IEmailSender,
  ) {}

  async signUp(
    dto: SignUpDto,
    deviceInfo: DeviceInfo,
  ): Promise<AuthResponseDto> {
    const existing = await this.userRepository.findByEmail(dto.email);
    if (existing) {
      throw new AuthError(
        AuthErrorCode.USER_ALREADY_EXISTS,
        'An account with this email already exists',
      );
    }

    const passwordHash = await this.passwordHasher.hash(dto.password);
    const user = new User({
      email: dto.email,
      passwordHash,
      authProvider: 'email',
      emailVerified: false,
    });

    await this.userRepository.save(user);
    return this.issueTokens(user, deviceInfo);
  }

  async signIn(
    dto: SignInDto,
    deviceInfo: DeviceInfo,
  ): Promise<AuthResponseDto> {
    const user = await this.userRepository.findByEmail(dto.email);
    if (!user || !user.passwordHash) {
      throw new AuthError(
        AuthErrorCode.INVALID_CREDENTIALS,
        'Invalid email or password',
      );
    }

    const valid = await this.passwordHasher.compare(
      dto.password,
      user.passwordHash,
    );
    if (!valid) {
      throw new AuthError(
        AuthErrorCode.INVALID_CREDENTIALS,
        'Invalid email or password',
      );
    }

    return this.issueTokens(user, deviceInfo);
  }

  async signInSocial(
    dto: SocialLoginDto,
    deviceInfo: DeviceInfo,
  ): Promise<AuthResponseDto> {
    const profile = await this.identityProvider.verifySocialToken(
      dto.provider,
      dto.idToken,
    );
    const user = await this.userRepository.findByEmail(profile.email);

    if (user && user.authProvider !== dto.provider) {
      throw new AuthError(
        AuthErrorCode.AUTH_PROVIDER_MISMATCH,
        'This email is already associated with a different authentication method',
      );
    }

    if (user) {
      return this.issueTokens(user, deviceInfo);
    }

    const newUser = new User({
      email: profile.email,
      authProvider: dto.provider,
      providerUserId: profile.providerUserId,
      emailVerified: true,
    });
    await this.userRepository.save(newUser);

    return this.issueTokens(newUser, deviceInfo);
  }

  async sendOtp(dto: SendOtpDto): Promise<{ sent: boolean }> {
    const code = await this.otpService.generateCode(dto.email);
    await this.emailSender.sendOtp(dto.email, code);
    return { sent: true };
  }

  async verifyOtp(
    dto: VerifyOtpDto,
    deviceInfo: DeviceInfo,
  ): Promise<AuthResponseDto> {
    const valid = await this.otpService.verifyCode(dto.email, dto.code);
    if (!valid) {
      throw new AuthError(AuthErrorCode.INVALID_OTP, 'Invalid or expired OTP');
    }

    let user = await this.userRepository.findByEmail(dto.email);
    if (!user) {
      user = new User({
        email: dto.email,
        authProvider: 'email',
        emailVerified: true,
      });
      await this.userRepository.save(user);
    } else {
      user.verifyEmail();
      await this.userRepository.save(user);
    }

    return this.issueTokens(user, deviceInfo);
  }

  async refreshToken(
    dto: RefreshTokenDto,
    deviceInfo: DeviceInfo,
  ): Promise<AuthResponseDto> {
    const tokenHash = this.tokenService.hashRefreshToken(dto.refreshToken);
    const refreshToken =
      await this.refreshTokenRepository.findByTokenHash(tokenHash);

    if (!refreshToken || refreshToken.isRevoked() || refreshToken.isExpired()) {
      throw new AuthError(
        AuthErrorCode.INVALID_TOKEN,
        'Invalid or expired refresh token',
      );
    }

    refreshToken.revoke();
    await this.refreshTokenRepository.save(refreshToken);

    const user = await this.userRepository.findById(refreshToken.userId);
    if (!user) {
      throw new AuthError(AuthErrorCode.USER_NOT_FOUND, 'User not found');
    }

    return this.issueTokens(user, deviceInfo);
  }

  async logout(dto: RefreshTokenDto): Promise<{ success: boolean }> {
    const tokenHash = this.tokenService.hashRefreshToken(dto.refreshToken);
    const refreshToken =
      await this.refreshTokenRepository.findByTokenHash(tokenHash);

    if (refreshToken && !refreshToken.isRevoked()) {
      refreshToken.revoke();
      await this.refreshTokenRepository.save(refreshToken);
    }

    return { success: true };
  }

  async requestPasswordReset(
    dto: RequestPasswordResetDto,
  ): Promise<{ sent: boolean }> {
    const user = await this.userRepository.findByEmail(dto.email);
    if (user) {
      const token = await this.passwordResetService.generateToken(dto.email);
      await this.emailSender.sendPasswordReset(dto.email, token);
    }
    return { sent: true };
  }

  async resetPassword(
    dto: ResetPasswordDto,
    deviceInfo: DeviceInfo,
  ): Promise<AuthResponseDto> {
    const email = await this.passwordResetService.validateToken(dto.token);
    const user = await this.userRepository.findByEmail(email);
    if (!user) {
      throw new AuthError(AuthErrorCode.USER_NOT_FOUND, 'User not found');
    }

    const passwordHash = await this.passwordHasher.hash(dto.newPassword);
    user.updatePassword(passwordHash);
    await this.userRepository.save(user);

    return this.issueTokens(user, deviceInfo);
  }

  async getProfile(userId: string): Promise<UserProfileDto> {
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new AuthError(AuthErrorCode.USER_NOT_FOUND, 'User not found');
    }

    return {
      id: user.id,
      email: user.email,
      authProvider: user.authProvider,
      emailVerified: user.emailVerified,
      mfaEnabled: user.mfaEnabled,
    };
  }

  async registerDevice(
    userId: string,
    dto: RegisterDeviceDto,
    deviceInfo: DeviceInfo,
  ): Promise<AuthResponseDto> {
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new AuthError(AuthErrorCode.USER_NOT_FOUND, 'User not found');
    }
    return this.issueTokens(user, {
      ...deviceInfo,
      deviceId: dto.deviceId ?? deviceInfo.deviceId,
      deviceName: dto.deviceName ?? deviceInfo.deviceName,
    });
  }

  private async issueTokens(
    user: User,
    deviceInfo: DeviceInfo,
  ): Promise<AuthResponseDto> {
    const accessToken = this.tokenService.generateAccessToken({
      sub: user.id,
      email: user.email,
      type: 'access',
    });

    const rawRefreshToken = this.tokenService.generateRefreshToken();
    const tokenHash = this.tokenService.hashRefreshToken(rawRefreshToken);
    const refreshToken = new RefreshToken({
      userId: user.id,
      tokenHash,
      expiresAt: this.tokenService.getRefreshTokenExpiresAt(),
    });
    await this.refreshTokenRepository.save(refreshToken);

    const session = new DeviceSession({
      userId: user.id,
      refreshTokenId: refreshToken.id,
      deviceId: deviceInfo.deviceId,
      deviceName: deviceInfo.deviceName,
      ipAddress: deviceInfo.ipAddress,
      userAgent: deviceInfo.userAgent,
    });
    await this.deviceSessionRepository.save(session);

    return {
      accessToken,
      refreshToken: rawRefreshToken,
      expiresIn: this.tokenService.getAccessTokenExpiresInSeconds(),
      user: {
        id: user.id,
        email: user.email,
        authProvider: user.authProvider,
      },
    };
  }
}
