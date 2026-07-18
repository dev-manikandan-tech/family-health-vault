import {
  IStorageProvider,
  PresignedUrlResult,
  StorageObjectMetadata,
} from '../../src/domain/services/storage-provider.interface';

export class FakeStorageProvider implements IStorageProvider {
  private readonly objects = new Map<
    string,
    { metadata: StorageObjectMetadata; body: Buffer }
  >();

  async getPresignedUploadUrl(
    key: string,
    _contentType: string,
  ): Promise<PresignedUrlResult> {
    return {
      url: `https://fake-storage.test/upload/${key}`,
      key,
    };
  }

  async getPresignedDownloadUrl(key: string): Promise<string> {
    return `https://fake-storage.test/download/${key}`;
  }

  async getObject(key: string): Promise<Buffer> {
    const obj = this.objects.get(key);
    if (!obj) throw new Error('Object not found');
    return obj.body;
  }

  async putObject(
    key: string,
    body: Buffer,
    contentType: string,
  ): Promise<void> {
    this.objects.set(key, {
      body,
      metadata: { key, size: body.length, contentType },
    });
  }

  async getObjectMetadata(key: string): Promise<StorageObjectMetadata | null> {
    return this.objects.get(key)?.metadata ?? null;
  }

  setObjectMetadata(
    key: string,
    metadata: StorageObjectMetadata,
    body?: Buffer,
  ): void {
    this.objects.set(key, { metadata, body: body ?? Buffer.from('') });
  }

  async deleteObject(): Promise<void> {
    // no-op in tests
  }
}
