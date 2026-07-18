import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { SUPABASE_AUTH_CLIENT } from '../src/domain/constants/injection-tokens';
import { FakeSupabaseAuthClient } from './support/fake-supabase-auth.client';

describe('VisitController (e2e)', () => {
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

  async function createFamily(userToken: string, name: string) {
    const res = await request(app.getHttpServer())
      .post('/api/v1/families')
      .set('Authorization', `Bearer ${userToken}`)
      .send({ name })
      .expect(201);
    return res.body;
  }

  async function createProfile(
    userToken: string,
    familyId: string,
    name: string,
  ) {
    const res = await request(app.getHttpServer())
      .post('/api/v1/profiles')
      .set('Authorization', `Bearer ${userToken}`)
      .send({ name, familyId })
      .expect(201);
    return res.body;
  }

  async function inviteAndAccept(
    ownerToken: string,
    familyId: string,
    memberSub: string,
    memberEmail: string,
  ) {
    const invite = await request(app.getHttpServer())
      .post(`/api/v1/families/${familyId}/invite`)
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({ email: memberEmail, role: 'member' })
      .expect(201);

    await request(app.getHttpServer())
      .post('/api/v1/families/invitations/accept')
      .set('Authorization', `Bearer ${tokenFor(memberSub, memberEmail)}`)
      .send({ token: invite.body.token, name: 'Member' })
      .expect(201);
  }

  it('creates, lists, updates, deletes, and restores a visit', async () => {
    const owner = tokenFor('visit-owner', 'owner@example.com');
    const family = await createFamily(owner, 'Visit Family');
    const profile = await createProfile(owner, family.id, 'Patient');

    const visit = await request(app.getHttpServer())
      .post(`/api/v1/profiles/${profile.id}/visits`)
      .set('Authorization', `Bearer ${owner}`)
      .send({
        title: 'Annual Checkup',
        visitedAt: '2024-06-15T10:00:00.000Z',
        doctorName: 'Dr. Rao',
        hospitalName: 'Apollo',
        diagnosis: 'Healthy',
        notes: 'Routine',
      })
      .expect(201);

    expect(visit.body.doctorName).toBe('Dr. Rao');

    const list = await request(app.getHttpServer())
      .get(`/api/v1/profiles/${profile.id}/visits`)
      .set('Authorization', `Bearer ${owner}`)
      .expect(200);

    expect(list.body.total).toBe(1);
    expect(list.body.data[0].doctorName).toBe('Dr. Rao');

    const updated = await request(app.getHttpServer())
      .patch(`/api/v1/visits/${visit.body.id}`)
      .set('Authorization', `Bearer ${owner}`)
      .send({ diagnosis: 'All clear' })
      .expect(200);

    expect(updated.body.diagnosis).toBe('All clear');

    await request(app.getHttpServer())
      .delete(`/api/v1/visits/${visit.body.id}`)
      .set('Authorization', `Bearer ${owner}`)
      .expect(204);

    await request(app.getHttpServer())
      .get(`/api/v1/visits/${visit.body.id}`)
      .set('Authorization', `Bearer ${owner}`)
      .expect(404);

    const afterDelete = await request(app.getHttpServer())
      .get(`/api/v1/profiles/${profile.id}/visits`)
      .set('Authorization', `Bearer ${owner}`)
      .expect(200);

    expect(afterDelete.body.total).toBe(0);

    const restored = await request(app.getHttpServer())
      .post(`/api/v1/visits/${visit.body.id}/restore`)
      .set('Authorization', `Bearer ${owner}`)
      .expect(201);

    expect(restored.body.id).toBe(visit.body.id);

    const afterRestore = await request(app.getHttpServer())
      .get(`/api/v1/profiles/${profile.id}/visits`)
      .set('Authorization', `Bearer ${owner}`)
      .expect(200);

    expect(afterRestore.body.total).toBe(1);
  });

  it('authorizes visits through profile grants', async () => {
    const owner = tokenFor('visit-owner-2', 'owner2@example.com');
    const member = tokenFor('visit-member', 'member@example.com');
    const family = await createFamily(owner, 'Visit Grant Family');
    const profile = await createProfile(owner, family.id, 'Grant Patient');
    await inviteAndAccept(
      owner,
      family.id,
      'visit-member',
      'member@example.com',
    );

    const visit = await request(app.getHttpServer())
      .post(`/api/v1/profiles/${profile.id}/visits`)
      .set('Authorization', `Bearer ${owner}`)
      .send({ doctorName: 'Dr. X' })
      .expect(201);

    await request(app.getHttpServer())
      .get(`/api/v1/visits/${visit.body.id}`)
      .set('Authorization', `Bearer ${member}`)
      .expect(403);

    await request(app.getHttpServer())
      .post(`/api/v1/profiles/${profile.id}/grants`)
      .set('Authorization', `Bearer ${owner}`)
      .send({ granteeUserId: 'visit-member', scope: 'visits_only' })
      .expect(201);

    const access = await request(app.getHttpServer())
      .get(`/api/v1/visits/${visit.body.id}`)
      .set('Authorization', `Bearer ${member}`)
      .expect(200);

    expect(access.body.doctorName).toBe('Dr. X');

    await request(app.getHttpServer())
      .patch(`/api/v1/visits/${visit.body.id}`)
      .set('Authorization', `Bearer ${member}`)
      .send({ diagnosis: 'Attempt' })
      .expect(403);

    await request(app.getHttpServer())
      .post(`/api/v1/profiles/${profile.id}/grants`)
      .set('Authorization', `Bearer ${owner}`)
      .send({ granteeUserId: 'visit-member', scope: 'full' })
      .expect(201);

    await request(app.getHttpServer())
      .patch(`/api/v1/visits/${visit.body.id}`)
      .set('Authorization', `Bearer ${member}`)
      .send({ diagnosis: 'Updated' })
      .expect(200);
  });
});
