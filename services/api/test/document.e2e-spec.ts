import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import {
  EXTRACTOR_PROVIDER,
  STORAGE_PROVIDER,
  SUPABASE_AUTH_CLIENT,
} from '../src/domain/constants/injection-tokens';
import { FakeSupabaseAuthClient } from './support/fake-supabase-auth.client';
import { FakeStorageProvider } from './support/fake-storage.provider';
import { FakeExtractorProvider } from '../src/infrastructure/ai/fake-extractor.provider';

describe('DocumentController (e2e)', () => {
  let app: INestApplication;
  let fakeSupabase: FakeSupabaseAuthClient;
  let fakeStorage: FakeStorageProvider;
  let fakeExtractor: FakeExtractorProvider;

  beforeAll(async () => {
    process.env.NODE_ENV = 'test';
    process.env.DB_TYPE = 'better-sqlite3';
    process.env.DB_DATABASE = ':memory:';
    process.env.JWT_SECRET = 'test-secret-not-for-production';
    process.env.RATE_LIMIT_POINTS = '1000';
    process.env.DOCUMENT_QUEUE_PROVIDER = 'fake';

    const { AppModule } = await import('../src/app.module');

    fakeSupabase = new FakeSupabaseAuthClient('test-secret-not-for-production');
    fakeStorage = new FakeStorageProvider();
    fakeExtractor = new FakeExtractorProvider();

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(SUPABASE_AUTH_CLIENT)
      .useValue(fakeSupabase)
      .overrideProvider(STORAGE_PROVIDER)
      .useValue(fakeStorage)
      .overrideProvider(EXTRACTOR_PROVIDER)
      .useValue(fakeExtractor)
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

  it('requests upload URL, confirms upload, and processes a document', async () => {
    const owner = tokenFor('doc-owner', 'owner@example.com');
    const family = await createFamily(owner, 'Doc Family');
    const profile = await createProfile(owner, family.id, 'Doc Patient');

    const presign = await request(app.getHttpServer())
      .post(`/api/v1/profiles/${profile.id}/documents/presigned-upload`)
      .set('Authorization', `Bearer ${owner}`)
      .send({
        originalName: 'report.pdf',
        contentType: 'application/pdf',
      })
      .expect(201);

    const documentId = presign.body.documentId;
    const originalKey = presign.body.originalKey;
    expect(presign.body.uploadUrl).toContain(originalKey);

    const buffer = Buffer.from('fake pdf content');
    fakeStorage.setObjectMetadata(
      originalKey,
      { key: originalKey, size: buffer.length, contentType: 'application/pdf' },
      buffer,
    );

    const confirmed = await request(app.getHttpServer())
      .post(`/api/v1/documents/${documentId}/confirm-upload`)
      .set('Authorization', `Bearer ${owner}`)
      .send({ size: buffer.length })
      .expect(200);

    expect(confirmed.body.status).toBe('ready');
    expect(confirmed.body.size).toBe(buffer.length);

    const get = await request(app.getHttpServer())
      .get(`/api/v1/documents/${documentId}`)
      .set('Authorization', `Bearer ${owner}`)
      .expect(200);

    expect(get.body.status).toBe('ready');
    expect(get.body.extractedMetadata.fileSize).toBe(buffer.length);
    expect(get.body.extractionStatus).toBe('extracted');
    expect(get.body.extractedEntities.documentType).toBe('generic');

    const extraction = await request(app.getHttpServer())
      .get(`/api/v1/documents/${documentId}/extraction`)
      .set('Authorization', `Bearer ${owner}`)
      .expect(200);

    expect(extraction.body.extractionStatus).toBe('extracted');
    expect(extraction.body.extractedEntities.documentType).toBe('generic');

    const download = await request(app.getHttpServer())
      .get(`/api/v1/documents/${documentId}/download`)
      .set('Authorization', `Bearer ${owner}`)
      .expect(200);

    expect(typeof download.text).toBe('string');
    expect(download.text).toContain(originalKey);

    await request(app.getHttpServer())
      .delete(`/api/v1/documents/${documentId}`)
      .set('Authorization', `Bearer ${owner}`)
      .expect(204);

    await request(app.getHttpServer())
      .get(`/api/v1/documents/${documentId}`)
      .set('Authorization', `Bearer ${owner}`)
      .expect(404);
  });

  it('processes an image and creates a thumbnail', async () => {
    const owner = tokenFor('doc-image-owner', 'image-owner@example.com');
    const family = await createFamily(owner, 'Image Family');
    const profile = await createProfile(owner, family.id, 'Image Patient');

    const presign = await request(app.getHttpServer())
      .post(`/api/v1/profiles/${profile.id}/documents/presigned-upload`)
      .set('Authorization', `Bearer ${owner}`)
      .send({
        originalName: 'scan.png',
        contentType: 'image/png',
      })
      .expect(201);

    // Create a minimal valid PNG buffer (1x1 pixel)
    const png = Buffer.from(
      'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==',
      'base64',
    );
    fakeStorage.setObjectMetadata(
      presign.body.originalKey,
      {
        key: presign.body.originalKey,
        size: png.length,
        contentType: 'image/png',
      },
      png,
    );

    const confirmed = await request(app.getHttpServer())
      .post(`/api/v1/documents/${presign.body.documentId}/confirm-upload`)
      .set('Authorization', `Bearer ${owner}`)
      .send({ size: png.length })
      .expect(200);

    expect(confirmed.body.status).toBe('ready');
    expect(confirmed.body.thumbnailKey).toBeDefined();
    expect(confirmed.body.convertedKey).toBeDefined();
  });

  it('flags low-confidence extraction for review and allows correction', async () => {
    const owner = tokenFor('doc-review-owner', 'review-owner@example.com');
    const family = await createFamily(owner, 'Review Family');
    const profile = await createProfile(owner, family.id, 'Review Patient');

    fakeExtractor.setResult({
      documentType: 'prescription',
      confidence: 0.4,
      entities: {
        documentType: 'prescription',
        confidence: 0.4,
        doctorName: 'Dr. X',
      },
      rawText: 'low confidence extraction',
    });

    const presign = await request(app.getHttpServer())
      .post(`/api/v1/profiles/${profile.id}/documents/presigned-upload`)
      .set('Authorization', `Bearer ${owner}`)
      .send({
        originalName: 'prescription.pdf',
        contentType: 'application/pdf',
      })
      .expect(201);

    const buffer = Buffer.from('fake pdf content');
    fakeStorage.setObjectMetadata(
      presign.body.originalKey,
      {
        key: presign.body.originalKey,
        size: buffer.length,
        contentType: 'application/pdf',
      },
      buffer,
    );

    const confirmed = await request(app.getHttpServer())
      .post(`/api/v1/documents/${presign.body.documentId}/confirm-upload`)
      .set('Authorization', `Bearer ${owner}`)
      .send({ size: buffer.length })
      .expect(200);

    expect(confirmed.body.extractionStatus).toBe('needs_review');

    const corrected = await request(app.getHttpServer())
      .patch(`/api/v1/documents/${presign.body.documentId}/extraction`)
      .set('Authorization', `Bearer ${owner}`)
      .send({
        extractedEntities: {
          documentType: 'prescription',
          confidence: 1,
          doctorName: 'Dr. Y',
          medications: [{ name: 'Paracetamol', dosage: '500mg' }],
        },
        correctedBy: owner,
      })
      .expect(200);

    expect(corrected.body.extractionStatus).toBe('corrected');
    expect(corrected.body.extractedEntities.doctorName).toBe('Dr. Y');

    await request(app.getHttpServer())
      .patch(`/api/v1/documents/${presign.body.documentId}/extraction`)
      .set('Authorization', `Bearer ${owner}`)
      .send({
        extractedEntities: {
          documentType: 'unknown_type',
          confidence: 1,
        },
        correctedBy: owner,
      })
      .expect(400);
  });
});
