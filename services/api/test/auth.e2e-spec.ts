import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { SUPABASE_AUTH_CLIENT } from '../src/domain/constants/injection-tokens';
import { FakeSupabaseAuthClient } from './support/fake-supabase-auth.client';

describe('AuthController (e2e)', () => {
  let app: INestApplication;
  let fakeSupabase: FakeSupabaseAuthClient;

  beforeAll(async () => {
    process.env.NODE_ENV = 'test';
    process.env.DB_TYPE = 'better-sqlite3';
    process.env.DB_DATABASE = ':memory:';
    process.env.JWT_SECRET = 'test-secret-not-for-production';
    process.env.RATE_LIMIT_POINTS = '1000';

    const { AppModule } = await import('../src/app.module');

    fakeSupabase = new FakeSupabaseAuthClient('test-secret-not-for-production');

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(SUPABASE_AUTH_CLIENT)
      .useValue(fakeSupabase)
      .compile();

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

  it('/auth/me (GET) - returns profile for authenticated user and creates on first request', async () => {
    const token = fakeSupabase.signToken({
      sub: 'auth0|new-user',
      email: 'new@example.com',
    });

    const res = await request(app.getHttpServer())
      .get('/api/v1/auth/me')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(res.body.email).toBe('new@example.com');
    expect(res.body.authProvider).toBe('email');
  });

  it('/auth/me (GET) - rejects invalid token', async () => {
    await request(app.getHttpServer())
      .get('/api/v1/auth/me')
      .set('Authorization', 'Bearer invalid-token')
      .expect(401);
  });

  it('/auth/devices (POST) - registers a device session and GET lists it', async () => {
    const token = fakeSupabase.signToken({
      sub: 'auth0|device-user',
      email: 'device@example.com',
    });

    const create = await request(app.getHttpServer())
      .post('/api/v1/auth/devices')
      .set('Authorization', `Bearer ${token}`)
      .send({ deviceId: 'device-001', deviceName: 'Test Phone' })
      .expect(201);

    expect(create.body.deviceId).toBe('device-001');

    const list = await request(app.getHttpServer())
      .get('/api/v1/auth/devices')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(list.body).toHaveLength(1);
    expect(list.body[0].deviceId).toBe('device-001');
  });

  it('/auth/devices (DELETE) - revokes a device session', async () => {
    const token = fakeSupabase.signToken({
      sub: 'auth0|revoke-user',
      email: 'revoke@example.com',
    });

    const create = await request(app.getHttpServer())
      .post('/api/v1/auth/devices')
      .set('Authorization', `Bearer ${token}`)
      .send({ deviceId: 'device-to-revoke' })
      .expect(201);

    await request(app.getHttpServer())
      .delete(`/api/v1/auth/devices/${create.body.id}`)
      .set('Authorization', `Bearer ${token}`)
      .expect(204);

    const list = await request(app.getHttpServer())
      .get('/api/v1/auth/devices')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(list.body).toHaveLength(0);
  });

  it('/auth/account/delete (POST) - soft deletes and re-login cancels deletion', async () => {
    const sub = 'auth0|delete-user';
    const token = fakeSupabase.signToken({
      sub,
      email: 'delete@example.com',
    });

    await request(app.getHttpServer())
      .post('/api/v1/auth/account/delete')
      .set('Authorization', `Bearer ${token}`)
      .expect(204);

    const cancel = await request(app.getHttpServer())
      .post('/api/v1/auth/account/delete/cancel')
      .set('Authorization', `Bearer ${token}`)
      .expect(201);

    expect(cancel.body.email).toBe('delete@example.com');
  });

  it('/auth/otp/phone (POST) - sends and verifies phone OTP', async () => {
    await request(app.getHttpServer())
      .post('/api/v1/auth/otp/phone/send')
      .send({ phone: '+15550001111' })
      .expect(200);

    const res = await request(app.getHttpServer())
      .post('/api/v1/auth/otp/phone/verify')
      .send({ phone: '+15550001111', code: '123456' })
      .expect(200);

    expect(res.body.phone).toBe('+15550001111');
    expect(res.body.authProvider).toBe('phone');
  });
});
