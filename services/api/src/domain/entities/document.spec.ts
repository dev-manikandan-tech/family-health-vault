import { Document } from './document.entity';

describe('Document', () => {
  it('creates with pending_upload status', () => {
    const doc = new Document({
      patientProfileId: 'profile-1',
      uploadedBy: 'user-1',
    });
    expect(doc.status).toBe('pending_upload');
    expect(doc.retryCount).toBe(0);
  });

  it('marks uploaded and then ready', () => {
    const doc = new Document({
      patientProfileId: 'profile-1',
      uploadedBy: 'user-1',
    });
    doc.markUploaded(1024, 'checksum');
    expect(doc.status).toBe('uploaded');
    expect(doc.size).toBe(1024);
    doc.markReady('converted', 'thumbnail', { width: 100 });
    expect(doc.status).toBe('ready');
    expect(doc.convertedKey).toBe('converted');
    expect(doc.thumbnailKey).toBe('thumbnail');
    expect(doc.extractedMetadata.width).toBe(100);
  });

  it('marks failed and increments retry', () => {
    const doc = new Document({
      patientProfileId: 'profile-1',
      uploadedBy: 'user-1',
    });
    doc.markFailed('scan timeout');
    expect(doc.status).toBe('failed');
    expect(doc.retryCount).toBe(1);
  });
});
