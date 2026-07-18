export interface PresignedUrlResult {
  url: string;
  key: string;
  fields?: Record<string, string>;
}

export interface StorageObjectMetadata {
  key: string;
  size: number;
  contentType?: string;
  etag?: string;
}

export interface IStorageProvider {
  getPresignedUploadUrl(
    key: string,
    contentType: string,
    expiresInSeconds?: number,
  ): Promise<PresignedUrlResult>;

  getPresignedDownloadUrl(
    key: string,
    expiresInSeconds?: number,
  ): Promise<string>;

  getObject(key: string): Promise<Buffer>;

  putObject(key: string, body: Buffer, contentType: string): Promise<void>;

  getObjectMetadata(key: string): Promise<StorageObjectMetadata | null>;

  deleteObject(key: string): Promise<void>;
}
