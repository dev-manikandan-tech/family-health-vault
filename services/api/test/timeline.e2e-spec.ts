import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { SUPABASE_AUTH_CLIENT } from '../src/domain/constants/injection-tokens';
import { FakeSupabaseAuthClient } from './support/fake-supabase-auth.client';

describe('TimelineController (e2e)', () => {
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

  it('creates timeline events for a visit and exports a PDF', async () => {
    const owner = tokenFor('timeline-owner', 'owner@example.com');

    const family = await request(app.getHttpServer())
      .post('/api/v1/families')
      .set('Authorization', `Bearer ${owner}`)
      .send({ name: 'Timeline Family' })
      .expect(201);

    const profile = await request(app.getHttpServer())
      .post('/api/v1/profiles')
      .set('Authorization', `Bearer ${owner}`)
      .send({ name: 'Timeline Patient', familyId: family.body.id })
      .expect(201);

    const visit = await request(app.getHttpServer())
      .post(`/api/v1/profiles/${profile.body.id}/visits`)
      .set('Authorization', `Bearer ${owner}`)
      .send({
        title: 'Annual Checkup',
        visitedAt: '2024-06-15T10:00:00.000Z',
        doctorName: 'Dr. Sharma',
        hospitalName: 'Apollo Hospital',
        diagnosis: 'Hypertension',
      })
      .expect(201);

    const timeline = await request(app.getHttpServer())
      .get(`/api/v1/profiles/${profile.body.id}/timeline`)
      .set('Authorization', `Bearer ${owner}`)
      .expect(200);

    expect(timeline.body.events.length).toBeGreaterThanOrEqual(1);
    expect(timeline.body.events[0].sourceId).toBe(visit.body.id);

    const pdf = await request(app.getHttpServer())
      .get(`/api/v1/profiles/${profile.body.id}/timeline/export.pdf`)
      .set('Authorization', `Bearer ${owner}`)
      .expect(200);

    expect(pdf.headers['content-type']).toBe('application/pdf');
    expect(pdf.body.length).toBeGreaterThan(0);
  });

  it('filters timeline by date range and paginates with cursor', async () => {
    const owner = tokenFor('timeline-owner-2', 'owner2@example.com');

    const family = await request(app.getHttpServer())
      .post('/api/v1/families')
      .set('Authorization', `Bearer ${owner}`)
      .send({ name: 'Timeline Family 2' })
      .expect(201);

    const profile = await request(app.getHttpServer())
      .post('/api/v1/profiles')
      .set('Authorization', `Bearer ${owner}`)
      .send({ name: 'Timeline Patient 2', familyId: family.body.id })
      .expect(201);

    const dates = ['2024-06-01', '2024-06-15', '2024-06-30'];
    for (const date of dates) {
      await request(app.getHttpServer())
        .post(`/api/v1/profiles/${profile.body.id}/visits`)
        .set('Authorization', `Bearer ${owner}`)
        .send({
          title: `Visit ${date}`,
          hospitalName: `Visit ${date}`,
          visitedAt: `${date}T10:00:00.000Z`,
          diagnosis: 'Checkup',
        })
        .expect(201);
    }

    const filtered = await request(app.getHttpServer())
      .get(
        `/api/v1/profiles/${profile.body.id}/timeline?fromDate=2024-06-10&toDate=2024-06-20`,
      )
      .set('Authorization', `Bearer ${owner}`)
      .expect(200);

    expect(filtered.body.events.length).toBe(1);
    expect(filtered.body.events[0].title).toBe('Visit 2024-06-15');

    const page1 = await request(app.getHttpServer())
      .get(`/api/v1/profiles/${profile.body.id}/timeline?limit=1`)
      .set('Authorization', `Bearer ${owner}`)
      .expect(200);

    expect(page1.body.events.length).toBe(1);
    expect(page1.body.nextCursor).toBeDefined();

    const cursor = `${page1.body.nextCursor.eventDate}|${page1.body.nextCursor.id}`;
    const page2 = await request(app.getHttpServer())
      .get(
        `/api/v1/profiles/${profile.body.id}/timeline?limit=1&cursor=${encodeURIComponent(cursor)}`,
      )
      .set('Authorization', `Bearer ${owner}`)
      .expect(200);

    expect(page2.body.events.length).toBe(1);
    expect(page2.body.events[0].title).not.toBe(page1.body.events[0].title);
  });
});
