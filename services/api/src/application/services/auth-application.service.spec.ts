import { Test, TestingModule } from '@nestjs/testing';
import { AuthApplicationService, DeviceInfo } from './auth-application.service';
import { User } from '../../domain/entities/user.entity';
import { DeviceSession } from '../../domain/entities/device-session.entity';
import { IUserRepository } from '../../domain/repositories/user.repository.interface';
import { IDeviceSessionRepository } from '../../domain/repositories/device-session.repository.interface';
import { IAuditLogRepository } from '../../domain/repositories/audit-log.repository.interface';
import { ISupabaseAuthClient } from '../../domain/services/supabase-auth-client.interface';
import {
  USER_REPOSITORY,
  DEVICE_SESSION_REPOSITORY,
  AUDIT_LOG_REPOSITORY,
  SUPABASE_AUTH_CLIENT,
  AUDIT_SERVICE,
} from '../../domain/constants/injection-tokens';
import { AuditService } from '../../infrastructure/audit/audit.service';

class InMemoryUserRepository implements IUserRepository {
  private users: User[] = [];

  async findById(id: string): Promise<User | null> {
    return this.users.find((u) => u.id === id) || null;
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.users.find((u) => u.email === email?.toLowerCase()) || null;
  }

  async save(user: User): Promise<User> {
    const index = this.users.findIndex((u) => u.id === user.id);
    if (index >= 0) {
      this.users[index] = user;
    } else {
      this.users.push(user);
    }
    return user;
  }
}

class InMemoryDeviceSessionRepository implements IDeviceSessionRepository {
  private sessions: DeviceSession[] = [];

  async findById(id: string): Promise<DeviceSession | null> {
    return this.sessions.find((s) => s.id === id) || null;
  }

  async findByUserId(userId: string): Promise<DeviceSession[]> {
    return this.sessions.filter((s) => s.userId === userId);
  }

  async findByUserAndDeviceId(
    userId: string,
    deviceId?: string,
  ): Promise<DeviceSession | null> {
    return (
      this.sessions.find(
        (s) => s.userId === userId && s.deviceId === deviceId,
      ) || null
    );
  }

  async save(session: DeviceSession): Promise<DeviceSession> {
    const index = this.sessions.findIndex((s) => s.id === session.id);
    if (index >= 0) {
      this.sessions[index] = session;
    } else {
      this.sessions.push(session);
    }
    return session;
  }

  async delete(id: string): Promise<void> {
    this.sessions = this.sessions.filter((s) => s.id !== id);
  }

  async deleteByUserId(userId: string): Promise<void> {
    this.sessions = this.sessions.filter((s) => s.userId !== userId);
  }
}

class InMemoryAuditLogRepository implements IAuditLogRepository {
  private logs: any[] = [];
  async save(log: any): Promise<any> {
    this.logs.push(log);
    return log;
  }
}

class FakeSupabaseAuthClient implements ISupabaseAuthClient {
  private tokens: Map<string, string> = new Map();
  private users: Map<string, { id: string; email?: string; phone?: string }> =
    new Map();

  signToken(payload: { sub: string; email?: string; phone?: string }): string {
    const token = `token-${payload.sub}`;
    this.tokens.set(token, payload.sub);
    this.users.set(payload.sub, {
      id: payload.sub,
      email: payload.email,
      phone: payload.phone,
    });
    return token;
  }

  async verifyAccessToken(token: string) {
    const sub = this.tokens.get(token);
    if (!sub) throw new Error('invalid');
    const user = this.users.get(sub)!;
    return { sub: user.id, email: user.email, phone: user.phone };
  }

  async sendPhoneOtp(): Promise<void> {}

  async verifyPhoneOtp(
    phone: string,
    code: string,
  ): Promise<{ userId: string; phone: string }> {
    if (code !== '123456') throw new Error('invalid');
    const userId = `phone-${phone}`;
    this.users.set(userId, { id: userId, phone });
    return { userId, phone };
  }

  async getUser(userId: string) {
    return this.users.get(userId) ?? null;
  }

  async deleteUser(): Promise<void> {}
}

describe('AuthApplicationService', () => {
  let service: AuthApplicationService;
  let userRepo: InMemoryUserRepository;
  let deviceSessionRepo: InMemoryDeviceSessionRepository;
  let supabase: FakeSupabaseAuthClient;

  beforeEach(async () => {
    userRepo = new InMemoryUserRepository();
    deviceSessionRepo = new InMemoryDeviceSessionRepository();
    supabase = new FakeSupabaseAuthClient();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthApplicationService,
        AuditService,
        { provide: USER_REPOSITORY, useValue: userRepo },
        { provide: DEVICE_SESSION_REPOSITORY, useValue: deviceSessionRepo },
        {
          provide: AUDIT_LOG_REPOSITORY,
          useValue: new InMemoryAuditLogRepository(),
        },
        { provide: AUDIT_SERVICE, useClass: AuditService },
        { provide: SUPABASE_AUTH_CLIENT, useValue: supabase },
      ],
    }).compile();

    service = module.get<AuthApplicationService>(AuthApplicationService);
  });

  const deviceInfo: DeviceInfo = {};

  describe('syncUser', () => {
    it('creates a local user on first token', async () => {
      const token = supabase.signToken({
        sub: 'auth0|abc',
        email: 'user@example.com',
      });
      const payload = await supabase.verifyAccessToken(token);
      const user = await service.syncUser(payload);

      expect(user.email).toBe('user@example.com');
      expect(await userRepo.findById(user.id)).toBeDefined();
    });

    it('restores a soft-deleted user on re-login', async () => {
      const user = new User({
        id: 'auth0|abc',
        email: 'user@example.com',
        authProvider: 'email',
        deletedAt: new Date(),
      });
      await userRepo.save(user);

      const token = supabase.signToken({
        sub: 'auth0|abc',
        email: 'user@example.com',
      });
      const payload = await supabase.verifyAccessToken(token);
      const synced = await service.syncUser(payload);

      const reloaded = await userRepo.findById(synced.id);
      expect(synced.deletedAt).toBeUndefined();
      expect(reloaded?.deletedAt).toBeUndefined();
    });
  });

  describe('account deletion', () => {
    it('soft deletes user and sessions', async () => {
      const user = new User({
        id: 'auth0|abc',
        email: 'user@example.com',
        authProvider: 'email',
      });
      await userRepo.save(user);
      await deviceSessionRepo.save(
        new DeviceSession({ userId: user.id, deviceId: 'd1' }),
      );

      await service.requestAccountDeletion(user.id, deviceInfo);

      const deleted = await userRepo.findById(user.id);
      expect(deleted?.deletedAt).toBeDefined();
      expect(await deviceSessionRepo.findByUserId(user.id)).toHaveLength(0);
    });

    it('cancels deletion', async () => {
      const user = new User({
        id: 'auth0|abc',
        email: 'user@example.com',
        authProvider: 'email',
        deletedAt: new Date(),
        deletionRequestedAt: new Date(),
      });
      await userRepo.save(user);

      const result = await service.cancelAccountDeletion(user.id, deviceInfo);
      const reloaded = await userRepo.findById(user.id);

      expect(result.deletedAt).toBeUndefined();
      expect(result.deletionRequestedAt).toBeUndefined();
      expect(reloaded?.deletedAt).toBeUndefined();
      expect(reloaded?.deletionRequestedAt).toBeUndefined();
      expect(result.id).toBe(user.id);
    });
  });

  describe('phone OTP', () => {
    it('creates user on verified phone OTP', async () => {
      const result = await service.verifyPhoneOtp(
        { phone: '+15550001111', code: '123456' },
        deviceInfo,
      );

      expect(result.phone).toBe('+15550001111');
      expect(result.authProvider).toBe('phone');
    });
  });

  describe('device sessions', () => {
    it('registers and lists device sessions', async () => {
      const user = new User({
        id: 'auth0|abc',
        email: 'user@example.com',
        authProvider: 'email',
      });
      await userRepo.save(user);

      await service.registerDevice(
        user.id,
        { deviceId: 'd1', deviceName: 'iPhone' },
        { ipAddress: '127.0.0.1' },
      );

      const sessions = await service.listDevices(user.id);
      expect(sessions).toHaveLength(1);
      expect(sessions[0].deviceId).toBe('d1');
    });

    it('revokes a device session', async () => {
      const user = new User({
        id: 'auth0|abc',
        email: 'user@example.com',
        authProvider: 'email',
      });
      await userRepo.save(user);
      const session = await deviceSessionRepo.save(
        new DeviceSession({ userId: user.id, deviceId: 'd1' }),
      );

      await service.revokeDevice(user.id, session.id, deviceInfo);

      expect(await deviceSessionRepo.findById(session.id)).toBeNull();
    });
  });
});
