import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { EMAIL_SENDER } from '../src/domain/constants/injection-tokens';
import { CapturingEmailSender } from './support/capturing-email.sender';
import { FakeIdentityProvider } from '../src/infrastructure/identity-providers/fake.identity-provider';

describe('AuthController (e2e)', () => {
  let app: INestApplication;
  let emailSender: CapturingEmailSender;
  let fakeIdentityProvider: FakeIdentityProvider;

  beforeAll(async () => {
    process.env.NODE_ENV = 'test';
    process.env.DB_TYPE = 'better-sqlite3';
    process.env.DB_DATABASE = ':memory:';
    process.env.JWT_SECRET = 'test-secret-not-for-production';
    process.env.JWT_EXPIRES_IN_SECONDS = '900';
    process.env.REFRESH_TOKEN_EXPIRES_IN_DAYS = '1';
    process.env.RATE_LIMIT_POINTS = '1000';

    const { AppModule } = await import('../src/app.module');

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(EMAIL_SENDER)
      .useClass(CapturingEmailSender)
      .compile();

    emailSender = moduleFixture.get<CapturingEmailSender>(EMAIL_SENDER);
    fakeIdentityProvider =
      moduleFixture.get<FakeIdentityProvider>(FakeIdentityProvider);

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api/v1');
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        transform: true,
        forbidNonWhitelisted: true,
      }),
    );
    await app.init();
  });

  afterAll(async () => {
    if (app) {
      await app.close();
    }
  });

  beforeEach(() => {
    emailSender.reset();
  });

  it('/auth/signup (POST) - creates a user and returns tokens', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/v1/auth/signup')
      .send({ email: 'user@example.com', password: 'password123' })
      .expect(201);

    expect(res.body.accessToken).toBeDefined();
    expect(res.body.refreshToken).toBeDefined();
    expect(res.body.user.email).toBe('user@example.com');
    expect(res.body.user.authProvider).toBe('email');
  });

  it('/auth/signin (POST) - authenticates an existing user', async () => {
    await request(app.getHttpServer())
      .post('/api/v1/auth/signup')
      .send({ email: 'signin@example.com', password: 'password123' });

    const res = await request(app.getHttpServer())
      .post('/api/v1/auth/signin')
      .send({ email: 'signin@example.com', password: 'password123' })
      .expect(200);

    expect(res.body.accessToken).toBeDefined();
    expect(res.body.refreshToken).toBeDefined();
  });

  it('/auth/me (GET) - returns profile for authenticated user', async () => {
    const signup = await request(app.getHttpServer())
      .post('/api/v1/auth/signup')
      .send({ email: 'profile@example.com', password: 'password123' });

    const res = await request(app.getHttpServer())
      .get('/api/v1/auth/me')
      .set('Authorization', `Bearer ${signup.body.accessToken}`)
      .expect(200);

    expect(res.body.email).toBe('profile@example.com');
  });

  it('/auth/refresh (POST) - rotates refresh token', async () => {
    const signup = await request(app.getHttpServer())
      .post('/api/v1/auth/signup')
      .send({ email: 'refresh@example.com', password: 'password123' });

    const res = await request(app.getHttpServer())
      .post('/api/v1/auth/refresh')
      .send({ refreshToken: signup.body.refreshToken })
      .expect(200);

    expect(res.body.accessToken).toBeDefined();
    expect(res.body.refreshToken).toBeDefined();
  });

  it('/auth/logout (POST) - revokes refresh token', async () => {
    const signup = await request(app.getHttpServer())
      .post('/api/v1/auth/signup')
      .send({ email: 'logout@example.com', password: 'password123' });

    await request(app.getHttpServer())
      .post('/api/v1/auth/logout')
      .send({ refreshToken: signup.body.refreshToken })
      .expect(200);

    await request(app.getHttpServer())
      .post('/api/v1/auth/refresh')
      .send({ refreshToken: signup.body.refreshToken })
      .expect(401);
  });

  it('/auth/social (POST) - signs in with Google token', async () => {
    fakeIdentityProvider.registerToken('google', 'valid-google-token', {
      provider: 'google',
      providerUserId: 'google-123',
      email: 'google@example.com',
    });

    const res = await request(app.getHttpServer())
      .post('/api/v1/auth/social')
      .send({ provider: 'google', idToken: 'valid-google-token' })
      .expect(200);

    expect(res.body.user.email).toBe('google@example.com');
    expect(res.body.user.authProvider).toBe('google');
  });

  it('/auth/otp (POST) - verifies email OTP', async () => {
    await request(app.getHttpServer())
      .post('/api/v1/auth/otp/send')
      .send({ email: 'otp@example.com' })
      .expect(200);

    expect(emailSender.lastOtp).toBeDefined();
    const code = emailSender.lastOtp!.code;

    const res = await request(app.getHttpServer())
      .post('/api/v1/auth/otp/verify')
      .send({ email: 'otp@example.com', code })
      .expect(200);

    expect(res.body.accessToken).toBeDefined();
    expect(res.body.user.email).toBe('otp@example.com');
  });

  it('/auth/social (POST) - signs in with Apple token', async () => {
    fakeIdentityProvider.registerToken('apple', 'valid-apple-token', {
      provider: 'apple',
      providerUserId: 'apple-123',
      email: 'apple@example.com',
    });

    const res = await request(app.getHttpServer())
      .post('/api/v1/auth/social')
      .send({ provider: 'apple', idToken: 'valid-apple-token' })
      .expect(200);

    expect(res.body.user.email).toBe('apple@example.com');
    expect(res.body.user.authProvider).toBe('apple');
  });

  it('/auth/password-reset (POST) - resets password', async () => {
    await request(app.getHttpServer())
      .post('/api/v1/auth/signup')
      .send({ email: 'reset@example.com', password: 'password123' });

    await request(app.getHttpServer())
      .post('/api/v1/auth/password-reset/request')
      .send({ email: 'reset@example.com' })
      .expect(200);

    expect(emailSender.lastPasswordReset).toBeDefined();
    const token = emailSender.lastPasswordReset!.token;

    const res = await request(app.getHttpServer())
      .post('/api/v1/auth/password-reset/confirm')
      .send({ token, newPassword: 'newpassword123' })
      .expect(200);

    expect(res.body.user.email).toBe('reset@example.com');

    await request(app.getHttpServer())
      .post('/api/v1/auth/signin')
      .send({ email: 'reset@example.com', password: 'newpassword123' })
      .expect(200);
  });

  it('/auth/devices/register (POST) - registers a new device session', async () => {
    const signup = await request(app.getHttpServer())
      .post('/api/v1/auth/signup')
      .send({ email: 'device@example.com', password: 'password123' });

    const res = await request(app.getHttpServer())
      .post('/api/v1/auth/devices/register')
      .set('Authorization', `Bearer ${signup.body.accessToken}`)
      .send({ deviceId: 'device-001', deviceName: 'Test Phone' })
      .expect(201);

    expect(res.body.accessToken).toBeDefined();
    expect(res.body.refreshToken).toBeDefined();
  });
});
