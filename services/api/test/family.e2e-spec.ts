import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { SUPABASE_AUTH_CLIENT } from '../src/domain/constants/injection-tokens';
import { FakeSupabaseAuthClient } from './support/fake-supabase-auth.client';

describe('FamilyController (e2e)', () => {
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

  const ownerToken = () =>
    fakeSupabase.signToken({
      sub: 'owner-user',
      email: 'owner@example.com',
    });

  const memberToken = () =>
    fakeSupabase.signToken({
      sub: 'member-user',
      email: 'member@example.com',
    });

  it('POST /families and GET /families/:id', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/v1/families')
      .set('Authorization', `Bearer ${ownerToken()}`)
      .send({ name: 'Sharma Family' })
      .expect(201);

    expect(res.body.name).toBe('Sharma Family');
    expect(res.body.memberCount).toBe(1);

    const get = await request(app.getHttpServer())
      .get(`/api/v1/families/${res.body.id}`)
      .set('Authorization', `Bearer ${ownerToken()}`)
      .expect(200);

    expect(get.body.id).toBe(res.body.id);
  });

  it('invite, accept, list and update family members', async () => {
    const owner = ownerToken();
    const member = memberToken();

    const family = await request(app.getHttpServer())
      .post('/api/v1/families')
      .set('Authorization', `Bearer ${owner}`)
      .send({ name: 'Invite Family' })
      .expect(201);

    const invite = await request(app.getHttpServer())
      .post(`/api/v1/families/${family.body.id}/invite`)
      .set('Authorization', `Bearer ${owner}`)
      .send({ email: 'member@example.com', role: 'member' })
      .expect(201);

    const accept = await request(app.getHttpServer())
      .post('/api/v1/families/invitations/accept')
      .set('Authorization', `Bearer ${member}`)
      .send({ token: invite.body.token, name: 'Member User' })
      .expect(201);

    expect(accept.body.role).toBe('member');

    const list = await request(app.getHttpServer())
      .get(`/api/v1/families/${family.body.id}/members`)
      .set('Authorization', `Bearer ${owner}`)
      .expect(200);

    expect(list.body.data).toHaveLength(2);

    const memberEntry = (
      list.body.data as Array<{ id: string; userId?: string }>
    ).find((m) => m.userId === 'member-user');

    const update = await request(app.getHttpServer())
      .patch(`/api/v1/families/${family.body.id}/members/${memberEntry.id}`)
      .set('Authorization', `Bearer ${owner}`)
      .send({ role: 'admin' })
      .expect(200);

    expect(update.body.role).toBe('admin');

    await request(app.getHttpServer())
      .delete(`/api/v1/families/${family.body.id}/members/${memberEntry.id}`)
      .set('Authorization', `Bearer ${owner}`)
      .expect(204);

    const afterRemove = await request(app.getHttpServer())
      .get(`/api/v1/families/${family.body.id}/members`)
      .set('Authorization', `Bearer ${owner}`)
      .expect(200);

    expect(afterRemove.body.data).toHaveLength(1);
  });

  it('denies non-admin member from updating family name', async () => {
    const owner = ownerToken();
    const member = memberToken();

    const family = await request(app.getHttpServer())
      .post('/api/v1/families')
      .set('Authorization', `Bearer ${owner}`)
      .send({ name: 'Restricted Family' })
      .expect(201);

    const invite = await request(app.getHttpServer())
      .post(`/api/v1/families/${family.body.id}/invite`)
      .set('Authorization', `Bearer ${owner}`)
      .send({ email: 'member@example.com', role: 'member' })
      .expect(201);

    await request(app.getHttpServer())
      .post('/api/v1/families/invitations/accept')
      .set('Authorization', `Bearer ${member}`)
      .send({ token: invite.body.token, name: 'Member User' })
      .expect(201);

    await request(app.getHttpServer())
      .patch(`/api/v1/families/${family.body.id}`)
      .set('Authorization', `Bearer ${member}`)
      .send({ name: 'Hacked Family' })
      .expect(403);
  });

  it('denies non-member creating a profile in an arbitrary family', async () => {
    const owner = ownerToken();
    const stranger = fakeSupabase.signToken({
      sub: 'stranger-user',
      email: 'stranger@example.com',
    });

    const family = await request(app.getHttpServer())
      .post('/api/v1/families')
      .set('Authorization', `Bearer ${owner}`)
      .send({ name: 'Private Family' })
      .expect(201);

    await request(app.getHttpServer())
      .post('/api/v1/profiles')
      .set('Authorization', `Bearer ${stranger}`)
      .send({
        name: 'Injected Profile',
        familyId: family.body.id,
        userId: 'some-user-id',
      })
      .expect(403);
  });

  it('allows update when a higher-scope grant exists alongside a lower-scope grant', async () => {
    const owner = ownerToken();
    const member = memberToken();

    const family = await request(app.getHttpServer())
      .post('/api/v1/families')
      .set('Authorization', `Bearer ${owner}`)
      .send({ name: 'Grant Family' })
      .expect(201);

    const profile = await request(app.getHttpServer())
      .post('/api/v1/profiles')
      .set('Authorization', `Bearer ${owner}`)
      .send({
        name: 'Shared Profile',
        familyId: family.body.id,
      })
      .expect(201);

    const invite = await request(app.getHttpServer())
      .post(`/api/v1/families/${family.body.id}/invite`)
      .set('Authorization', `Bearer ${owner}`)
      .send({ email: 'member@example.com', role: 'member' })
      .expect(201);

    await request(app.getHttpServer())
      .post('/api/v1/families/invitations/accept')
      .set('Authorization', `Bearer ${member}`)
      .send({ token: invite.body.token, name: 'Member User' })
      .expect(201);

    await request(app.getHttpServer())
      .post(`/api/v1/profiles/${profile.body.id}/grants`)
      .set('Authorization', `Bearer ${owner}`)
      .send({ granteeUserId: 'member-user', scope: 'emergency_card' })
      .expect(201);

    await request(app.getHttpServer())
      .get(`/api/v1/profiles/${profile.body.id}`)
      .set('Authorization', `Bearer ${member}`)
      .expect(200);

    await request(app.getHttpServer())
      .patch(`/api/v1/profiles/${profile.body.id}`)
      .set('Authorization', `Bearer ${member}`)
      .send({ name: 'Updated by member' })
      .expect(403);

    await request(app.getHttpServer())
      .post(`/api/v1/profiles/${profile.body.id}/grants`)
      .set('Authorization', `Bearer ${owner}`)
      .send({ granteeUserId: 'member-user', scope: 'full' })
      .expect(201);

    const update = await request(app.getHttpServer())
      .patch(`/api/v1/profiles/${profile.body.id}`)
      .set('Authorization', `Bearer ${member}`)
      .send({ name: 'Updated by member' })
      .expect(200);

    expect(update.body.name).toBe('Updated by member');
  });

  it('updates managedByUserId', async () => {
    const owner = ownerToken();
    const manager = fakeSupabase.signToken({
      sub: 'manager-user',
      email: 'manager@example.com',
    });

    const profile = await request(app.getHttpServer())
      .post('/api/v1/profiles')
      .set('Authorization', `Bearer ${owner}`)
      .send({ name: 'Handoff Profile' })
      .expect(201);

    const updated = await request(app.getHttpServer())
      .patch(`/api/v1/profiles/${profile.body.id}`)
      .set('Authorization', `Bearer ${owner}`)
      .send({ managedByUserId: 'manager-user' })
      .expect(200);

    expect(updated.body.managedByUserId).toBe('manager-user');

    await request(app.getHttpServer())
      .delete(`/api/v1/profiles/${profile.body.id}`)
      .set('Authorization', `Bearer ${manager}`)
      .expect(204);
  });

  it('creates and accesses patient profiles and grants', async () => {
    const owner = ownerToken();
    const member = memberToken();

    const family = await request(app.getHttpServer())
      .post('/api/v1/families')
      .set('Authorization', `Bearer ${owner}`)
      .send({ name: 'Health Family' })
      .expect(201);

    const profile = await request(app.getHttpServer())
      .post('/api/v1/profiles')
      .set('Authorization', `Bearer ${owner}`)
      .send({
        name: 'Dependent Child',
        familyId: family.body.id,
        dob: '2015-01-01',
        sex: 'male',
      })
      .expect(201);

    expect(profile.body.name).toBe('Dependent Child');

    const invite = await request(app.getHttpServer())
      .post(`/api/v1/families/${family.body.id}/invite`)
      .set('Authorization', `Bearer ${owner}`)
      .send({ email: 'member@example.com', role: 'member' })
      .expect(201);

    await request(app.getHttpServer())
      .post('/api/v1/families/invitations/accept')
      .set('Authorization', `Bearer ${member}`)
      .send({ token: invite.body.token, name: 'Member User' })
      .expect(201);

    await request(app.getHttpServer())
      .get(`/api/v1/profiles/${profile.body.id}`)
      .set('Authorization', `Bearer ${member}`)
      .expect(403);

    const grant = await request(app.getHttpServer())
      .post(`/api/v1/profiles/${profile.body.id}/grants`)
      .set('Authorization', `Bearer ${owner}`)
      .send({ granteeUserId: 'member-user', scope: 'full' })
      .expect(201);

    const access = await request(app.getHttpServer())
      .get(`/api/v1/profiles/${profile.body.id}`)
      .set('Authorization', `Bearer ${member}`)
      .expect(200);

    expect(access.body.id).toBe(profile.body.id);

    await request(app.getHttpServer())
      .delete(`/api/v1/profiles/${profile.body.id}/grants/${grant.body.id}`)
      .set('Authorization', `Bearer ${owner}`)
      .expect(204);

    await request(app.getHttpServer())
      .get(`/api/v1/profiles/${profile.body.id}`)
      .set('Authorization', `Bearer ${member}`)
      .expect(403);
  });
});
