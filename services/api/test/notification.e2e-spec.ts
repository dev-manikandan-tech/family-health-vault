import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { SUPABASE_AUTH_CLIENT } from '../src/domain/constants/injection-tokens';
import { FakeSupabaseAuthClient } from './support/fake-supabase-auth.client';

describe('NotificationController (e2e)', () => {
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

  const tokenFor = (sub: string, email: string) =>
    fakeSupabase.signToken({ sub, email });

  it('creates and lists an in-app notification', async () => {
    const user = tokenFor('notification-user', 'notify@example.com');

    const created = await request(app.getHttpServer())
      .post('/api/v1/notifications')
      .set('Authorization', `Bearer ${user}`)
      .send({
        title: 'Welcome',
        body: 'Thanks for joining MedVault',
        channel: 'in_app',
        type: 'welcome',
      })
      .expect(201);

    expect(created.body.status).toBe('sent');

    const list = await request(app.getHttpServer())
      .get('/api/v1/notifications')
      .set('Authorization', `Bearer ${user}`)
      .expect(200);

    expect(list.body.length).toBeGreaterThanOrEqual(1);
    expect(list.body[0].title).toBe('Welcome');
  });
});
