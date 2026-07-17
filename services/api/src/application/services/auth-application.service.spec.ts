import { Test, TestingModule } from '@nestjs/testing';
import { AuthApplicationService, DeviceInfo } from './auth-application.service';
import { User } from '../../domain/entities/user.entity';
import { RefreshToken } from '../../domain/entities/refresh-token.entity';
import { DeviceSession } from '../../domain/entities/device-session.entity';
import { IUserRepository } from '../../domain/repositories/user.repository.interface';
import { IRefreshTokenRepository } from '../../domain/repositories/refresh-token.repository.interface';
import { IDeviceSessionRepository } from '../../domain/repositories/device-session.repository.interface';
import { IPasswordHasher } from '../../domain/services/password-hasher.interface';
import { ITokenService } from '../../domain/services/token-service.interface';
import { IIdentityProvider } from '../../domain/services/identity-provider.interface';
import { IOtpService } from '../../domain/services/otp-service.interface';
import { IPasswordResetService } from '../../domain/services/password-reset-service.interface';
import { IEmailSender } from '../../domain/services/email-sender.interface';
import { AuthError, AuthErrorCode } from '../../domain/errors/auth.error';
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
  RefreshTokenDto,
  ResetPasswordDto,
} from '../dto';

class InMemoryUserRepository implements IUserRepository {
  private users: User[] = [];

  async findById(id: string): Promise<User | null> {
    return this.users.find((u) => u.id === id) || null;
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.users.find((u) => u.email === email.toLowerCase()) || null;
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

class InMemoryRefreshTokenRepository implements IRefreshTokenRepository {
  private tokens: RefreshToken[] = [];

  async findByTokenHash(tokenHash: string): Promise<RefreshToken | null> {
    return (
      this.tokens.find(
        (t) => t.tokenHash === tokenHash && !t.isRevoked() && !t.isExpired(),
      ) || null
    );
  }

  async save(token: RefreshToken): Promise<RefreshToken> {
    const index = this.tokens.findIndex((t) => t.id === token.id);
    if (index >= 0) {
      this.tokens[index] = token;
    } else {
      this.tokens.push(token);
    }
    return token;
  }

  async revoke(id: string): Promise<void> {
    const token = this.tokens.find((t) => t.id === id);
    if (token) token.revoke();
  }
}

class InMemoryDeviceSessionRepository implements IDeviceSessionRepository {
  private sessions: DeviceSession[] = [];

  async findById(id: string): Promise<DeviceSession | null> {
    return this.sessions.find((s) => s.id === id) || null;
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
}

describe('AuthApplicationService', () => {
  let service: AuthApplicationService;
  let userRepo: InMemoryUserRepository;
  let refreshTokenRepo: InMemoryRefreshTokenRepository;
  let deviceSessionRepo: InMemoryDeviceSessionRepository;
  let tokenService: ITokenService;
  let passwordHasher: IPasswordHasher;

  beforeEach(async () => {
    userRepo = new InMemoryUserRepository();
    refreshTokenRepo = new InMemoryRefreshTokenRepository();
    deviceSessionRepo = new InMemoryDeviceSessionRepository();

    passwordHasher = {
      hash: jest.fn(async (password: string) => `hashed:${password}`),
      compare: jest.fn(
        async (password: string, hash: string) => hash === `hashed:${password}`,
      ),
    };

    tokenService = {
      generateAccessToken: jest.fn(() => 'access-token'),
      verifyAccessToken: jest.fn(),
      generateRefreshToken: jest.fn(() => 'raw-refresh-token'),
      hashRefreshToken: jest.fn((token: string) => `hash:${token}`),
    };

    const identityProvider: IIdentityProvider = {
      verifySocialToken: jest.fn(async (provider) => ({
        provider,
        providerUserId: 'social-id',
        email: 'social@example.com',
      })),
    };

    const otpService: IOtpService = {
      generateCode: jest.fn(async () => '123456'),
      verifyCode: jest.fn(async () => true),
    };

    const passwordResetService: IPasswordResetService = {
      generateToken: jest.fn(async () => 'reset-token'),
      validateToken: jest.fn(async () => 'user@example.com'),
    };

    const emailSender: IEmailSender = {
      sendOtp: jest.fn(),
      sendPasswordReset: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthApplicationService,
        { provide: USER_REPOSITORY, useValue: userRepo },
        { provide: REFRESH_TOKEN_REPOSITORY, useValue: refreshTokenRepo },
        { provide: DEVICE_SESSION_REPOSITORY, useValue: deviceSessionRepo },
        { provide: PASSWORD_HASHER, useValue: passwordHasher },
        { provide: TOKEN_SERVICE, useValue: tokenService },
        { provide: IDENTITY_PROVIDER, useValue: identityProvider },
        { provide: OTP_SERVICE, useValue: otpService },
        { provide: PASSWORD_RESET_SERVICE, useValue: passwordResetService },
        { provide: EMAIL_SENDER, useValue: emailSender },
      ],
    }).compile();

    service = module.get<AuthApplicationService>(AuthApplicationService);
  });

  const deviceInfo: DeviceInfo = {};

  describe('signUp', () => {
    it('creates a user and returns tokens', async () => {
      const dto: SignUpDto = {
        email: 'user@example.com',
        password: 'password123',
      };
      const result = await service.signUp(dto, deviceInfo);

      expect(result.accessToken).toBe('access-token');
      expect(result.refreshToken).toBe('raw-refresh-token');
      expect(result.user.email).toBe('user@example.com');
      expect(result.user.authProvider).toBe('email');

      const saved = await userRepo.findByEmail('user@example.com');
      expect(saved).toBeDefined();
      expect(saved?.email).toBe('user@example.com');
    });

    it('throws when email already exists', async () => {
      const dto: SignUpDto = {
        email: 'user@example.com',
        password: 'password123',
      };
      await service.signUp(dto, deviceInfo);

      await expect(service.signUp(dto, deviceInfo)).rejects.toThrow(AuthError);
      await expect(service.signUp(dto, deviceInfo)).rejects.toMatchObject({
        code: AuthErrorCode.USER_ALREADY_EXISTS,
      });
    });
  });

  describe('signIn', () => {
    it('returns tokens for valid credentials', async () => {
      const signupDto: SignUpDto = {
        email: 'user@example.com',
        password: 'password123',
      };
      await service.signUp(signupDto, deviceInfo);

      const signinDto: SignInDto = {
        email: 'user@example.com',
        password: 'password123',
      };
      const result = await service.signIn(signinDto, deviceInfo);

      expect(result.accessToken).toBe('access-token');
      expect(result.refreshToken).toBe('raw-refresh-token');
    });

    it('throws for invalid credentials', async () => {
      const signupDto: SignUpDto = {
        email: 'user@example.com',
        password: 'password123',
      };
      await service.signUp(signupDto, deviceInfo);

      const signinDto: SignInDto = {
        email: 'user@example.com',
        password: 'wrong',
      };
      await expect(service.signIn(signinDto, deviceInfo)).rejects.toThrow(
        AuthError,
      );
    });
  });

  describe('refreshToken', () => {
    it('rotates refresh token and returns new tokens', async () => {
      const signupDto: SignUpDto = {
        email: 'user@example.com',
        password: 'password123',
      };
      const signedUp = await service.signUp(signupDto, deviceInfo);

      const dto: RefreshTokenDto = { refreshToken: signedUp.refreshToken };
      const result = await service.refreshToken(dto, deviceInfo);

      expect(result.accessToken).toBe('access-token');
      expect(result.refreshToken).toBe('raw-refresh-token');
    });

    it('throws for invalid refresh token', async () => {
      const dto: RefreshTokenDto = { refreshToken: 'invalid' };
      await expect(service.refreshToken(dto, deviceInfo)).rejects.toThrow(
        AuthError,
      );
    });
  });

  describe('password reset', () => {
    it('resets password and returns tokens', async () => {
      const signupDto: SignUpDto = {
        email: 'user@example.com',
        password: 'password123',
      };
      await service.signUp(signupDto, deviceInfo);

      const dto: ResetPasswordDto = {
        token: 'reset-token',
        newPassword: 'newpassword123',
      };
      const result = await service.resetPassword(dto, deviceInfo);

      expect(result.user.email).toBe('user@example.com');
    });
  });
});
