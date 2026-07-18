import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { SUPABASE_AUTH_CLIENT } from '../src/domain/constants/injection-tokens';
import { FakeSupabaseAuthClient } from './support/fake-supabase-auth.client';

describe('SearchController (e2e)', () => {
  let app: INestApplication;
  let fakeSupabase: FakeSupabaseAuthClient;

  beforeAll(async () => {
    process.env.NODE_ENV = 'test';
    process.env.DB_TYPE = 'better-sqlite3';
    process.env.DB_DATABASE = ':memory:';
    process.env.JWT_SECRET = 'test-secret-not-for-production';
    process.env.RATE_LIMIT_POINTS = '1000';
    process.env.DOCUMENT_QUEUE_PROVIDER = 'fake';

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

  it('finds a visit by doctor name and returns autocomplete suggestions', async () => {
    const owner = tokenFor('search-owner', 'search-owner@example.com');

    const family = await request(app.getHttpServer())
      .post('/api/v1/families')
      .set('Authorization', `Bearer ${owner}`)
      .send({ name: 'Search Family' })
      .expect(201);

    const profile = await request(app.getHttpServer())
      .post('/api/v1/profiles')
      .set('Authorization', `Bearer ${owner}`)
      .send({ name: 'Search Patient', familyId: family.body.id })
      .expect(201);

    await request(app.getHttpServer())
      .post(`/api/v1/profiles/${profile.body.id}/visits`)
      .set('Authorization', `Bearer ${owner}`)
      .send({
        title: 'Cardiology visit',
        visitedAt: '2024-07-20T10:00:00.000Z',
        doctorName: 'Dr. Aparna Rao',
        hospitalName: 'Fortis',
        diagnosis: 'Chest pain',
      })
      .expect(201);

    const results = await request(app.getHttpServer())
      .get(`/api/v1/search?q=Aparna`)
      .set('Authorization', `Bearer ${owner}`)
      .expect(200);

    expect(results.body.length).toBeGreaterThanOrEqual(1);

    const autocomplete = await request(app.getHttpServer())
      .get(`/api/v1/search/autocomplete?q=Apa`)
      .set('Authorization', `Bearer ${owner}`)
      .expect(200);

    expect(autocomplete.body.length).toBeGreaterThanOrEqual(1);
    expect(
      (autocomplete.body as string[]).some((s) =>
        s.toLowerCase().includes('aparna'),
      ),
    ).toBe(true);
  });
});
