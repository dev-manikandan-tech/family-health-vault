import { Inject, Injectable } from '@nestjs/common';
import { User } from '../../domain/entities/user.entity';
import { DeviceSession } from '../../domain/entities/device-session.entity';
import { AuthError, AuthErrorCode } from '../../domain/errors/auth.error';
import { IUserRepository } from '../../domain/repositories/user.repository.interface';
import { IDeviceSessionRepository } from '../../domain/repositories/device-session.repository.interface';
import { IAuditService } from '../../domain/services/audit-service.interface';
import {
  ISupabaseAuthClient,
  SupabaseTokenPayload,
} from '../../domain/services/supabase-auth-client.interface';
import {
  USER_REPOSITORY,
  DEVICE_SESSION_REPOSITORY,
  AUDIT_SERVICE,
  SUPABASE_AUTH_CLIENT,
} from '../../domain/constants/injection-tokens';
import {
  UserProfileDto,
  DeviceSessionDto,
  RegisterDeviceDto,
  SendPhoneOtpDto,
  VerifyPhoneOtpDto,
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
    @Inject(DEVICE_SESSION_REPOSITORY)
    private readonly deviceSessionRepository: IDeviceSessionRepository,
    @Inject(AUDIT_SERVICE)
    private readonly auditService: IAuditService,
    @Inject(SUPABASE_AUTH_CLIENT)
    private readonly supabaseClient: ISupabaseAuthClient,
  ) {}

  async syncUser(
    payload: SupabaseTokenPayload,
    deviceInfo?: DeviceInfo,
  ): Promise<User> {
    let user = await this.userRepository.findById(payload.sub);
    const wasDeleted = !!user?.deletedAt;
    const provider = payload.app_metadata?.provider ?? 'email';

    if (!user) {
      user = new User({
        id: payload.sub,
        email: payload.email,
        phone: payload.phone,
        authProvider: provider as any,
        emailVerified: !!payload.email,
        phoneVerified: !!payload.phone,
      });
      await this.auditService.log({
        action: 'USER_CREATED',
        resourceType: 'user',
        resourceId: user.id,
        actorId: user.id,
        ip: deviceInfo?.ipAddress,
        userAgent: deviceInfo?.userAgent,
        metadata: { provider },
      });
    } else {
      if (payload.email) user.email = payload.email.toLowerCase().trim();
      if (payload.phone) user.phone = payload.phone.trim();
    }

    if (wasDeleted) {
      user.restore();
      await this.auditService.log({
        action: 'USER_RESTORED',
        resourceType: 'user',
        resourceId: user.id,
        actorId: user.id,
        ip: deviceInfo?.ipAddress,
        userAgent: deviceInfo?.userAgent,
      });
    }

    user = await this.userRepository.save(user);

    if (deviceInfo?.deviceId) {
      await this.upsertDeviceSession(user.id, deviceInfo);
    }

    return user;
  }

  async getProfile(userId: string): Promise<UserProfileDto> {
    const user = await this.requireUser(userId);
    return this.toUserProfile(user);
  }

  async registerDevice(
    userId: string,
    dto: RegisterDeviceDto,
    deviceInfo: DeviceInfo,
  ): Promise<DeviceSessionDto> {
    const user = await this.requireUser(userId);
    const session = await this.upsertDeviceSession(user.id, {
      ...deviceInfo,
      deviceId: dto.deviceId,
      deviceName: dto.deviceName,
    });

    await this.auditService.log({
      action: 'DEVICE_REGISTERED',
      resourceType: 'device_session',
      resourceId: session.id,
      actorId: user.id,
      ip: deviceInfo.ipAddress,
      userAgent: deviceInfo.userAgent,
      metadata: { deviceId: dto.deviceId, deviceName: dto.deviceName },
    });

    return this.toDeviceSessionDto(session);
  }

  async listDevices(userId: string): Promise<DeviceSessionDto[]> {
    const user = await this.requireUser(userId);
    const sessions = await this.deviceSessionRepository.findByUserId(user.id);
    return sessions.map((s) => this.toDeviceSessionDto(s));
  }

  async revokeDevice(
    userId: string,
    sessionId: string,
    deviceInfo: DeviceInfo,
  ): Promise<void> {
    const user = await this.requireUser(userId);
    const session = await this.deviceSessionRepository.findById(sessionId);
    if (!session || session.userId !== user.id) {
      throw new AuthError(
        AuthErrorCode.USER_NOT_FOUND,
        'Device session not found',
      );
    }
    await this.deviceSessionRepository.delete(session.id);

    await this.auditService.log({
      action: 'DEVICE_REVOKED',
      resourceType: 'device_session',
      resourceId: session.id,
      actorId: user.id,
      ip: deviceInfo.ipAddress,
      userAgent: deviceInfo.userAgent,
    });
  }

  async requestAccountDeletion(
    userId: string,
    deviceInfo: DeviceInfo,
  ): Promise<void> {
    const user = await this.requireUser(userId);
    user.requestDeletion();
    user.softDelete();
    await this.userRepository.save(user);
    await this.deviceSessionRepository.deleteByUserId(user.id);

    await this.auditService.log({
      action: 'ACCOUNT_DELETION_REQUESTED',
      resourceType: 'user',
      resourceId: user.id,
      actorId: user.id,
      ip: deviceInfo.ipAddress,
      userAgent: deviceInfo.userAgent,
    });
  }

  async cancelAccountDeletion(
    userId: string,
    deviceInfo: DeviceInfo,
  ): Promise<UserProfileDto> {
    const user = await this.requireUser(userId);
    user.restore();
    const saved = await this.userRepository.save(user);

    await this.auditService.log({
      action: 'ACCOUNT_DELETION_CANCELED',
      resourceType: 'user',
      resourceId: saved.id,
      actorId: saved.id,
      ip: deviceInfo.ipAddress,
      userAgent: deviceInfo.userAgent,
    });

    return this.toUserProfile(saved);
  }

  async sendPhoneOtp(dto: SendPhoneOtpDto): Promise<void> {
    await this.supabaseClient.sendPhoneOtp(dto.phone);
  }

  async verifyPhoneOtp(
    dto: VerifyPhoneOtpDto,
    deviceInfo: DeviceInfo,
  ): Promise<UserProfileDto> {
    const { userId, phone } = await this.supabaseClient.verifyPhoneOtp(
      dto.phone,
      dto.code,
    );

    let user = await this.userRepository.findById(userId);
    if (!user) {
      user = new User({
        id: userId,
        phone,
        authProvider: 'phone',
        phoneVerified: true,
      });
    } else {
      user.phone = phone;
      user.phoneVerified = true;
      if (user.deletedAt) {
        user.restore();
      }
    }

    const saved = await this.userRepository.save(user);

    await this.auditService.log({
      action: 'PHONE_OTP_VERIFIED',
      resourceType: 'user',
      resourceId: saved.id,
      actorId: saved.id,
      ip: deviceInfo.ipAddress,
      userAgent: deviceInfo.userAgent,
      metadata: { phone },
    });

    if (deviceInfo.deviceId) {
      await this.upsertDeviceSession(saved.id, deviceInfo);
    }

    return this.toUserProfile(saved);
  }

  private async requireUser(userId: string): Promise<User> {
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new AuthError(AuthErrorCode.USER_NOT_FOUND, 'User not found');
    }
    return user;
  }

  private async upsertDeviceSession(
    userId: string,
    deviceInfo: DeviceInfo,
  ): Promise<DeviceSession> {
    let session = await this.deviceSessionRepository.findByUserAndDeviceId(
      userId,
      deviceInfo.deviceId,
    );
    if (session) {
      session.touch();
      session.deviceName = deviceInfo.deviceName ?? session.deviceName;
      session.ipAddress = deviceInfo.ipAddress ?? session.ipAddress;
      session.userAgent = deviceInfo.userAgent ?? session.userAgent;
    } else {
      session = new DeviceSession({
        userId,
        deviceId: deviceInfo.deviceId,
        deviceName: deviceInfo.deviceName,
        ipAddress: deviceInfo.ipAddress,
        userAgent: deviceInfo.userAgent,
      });
    }
    return this.deviceSessionRepository.save(session);
  }

  private toUserProfile(user: User): UserProfileDto {
    return {
      id: user.id,
      email: user.email,
      phone: user.phone,
      authProvider: user.authProvider,
      emailVerified: user.emailVerified,
      phoneVerified: user.phoneVerified,
      mfaEnabled: user.mfaEnabled,
      createdAt: user.createdAt,
    };
  }

  private toDeviceSessionDto(session: DeviceSession): DeviceSessionDto {
    return {
      id: session.id,
      userId: session.userId,
      deviceId: session.deviceId,
      deviceName: session.deviceName,
      ipAddress: session.ipAddress,
      userAgent: session.userAgent,
      lastActiveAt: session.lastActiveAt,
      createdAt: session.createdAt,
    };
  }
}
