import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  HeadObjectCommand,
  DeleteObjectCommand,
} from '@aws-sdk/client-s3';
import { Readable } from 'stream';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import {
  IStorageProvider,
  PresignedUrlResult,
  StorageObjectMetadata,
} from '../../domain/services/storage-provider.interface';

@Injectable()
export class S3StorageProvider implements IStorageProvider {
  private readonly client: S3Client;
  private readonly bucket: string;
  private readonly defaultTtl: number;

  constructor(private readonly configService: ConfigService) {
    const endpoint = this.configService.get<string>('STORAGE_ENDPOINT');
    const region =
      this.configService.get<string>('STORAGE_REGION') ?? 'us-east-1';
    const accessKeyId = this.configService.get<string>('STORAGE_ACCESS_KEY_ID');
    const secretAccessKey = this.configService.get<string>(
      'STORAGE_SECRET_ACCESS_KEY',
    );
    const forcePathStyle =
      this.configService.get<string>('STORAGE_FORCE_PATH_STYLE') === 'true' ||
      !!endpoint;

    this.client = new S3Client({
      region,
      endpoint,
      forcePathStyle,
      credentials:
        accessKeyId && secretAccessKey
          ? { accessKeyId, secretAccessKey }
          : undefined,
    });

    this.bucket =
      this.configService.get<string>('STORAGE_BUCKET') ?? 'family-health-vault';
    this.defaultTtl = parseInt(
      this.configService.get<string>('STORAGE_PRESIGNED_URL_TTL') ?? '300',
      10,
    );
  }

  async getPresignedUploadUrl(
    key: string,
    contentType: string,
    expiresInSeconds?: number,
  ): Promise<PresignedUrlResult> {
    const command = new PutObjectCommand({
      Bucket: this.bucket,
      Key: key,
      ContentType: contentType,
      ServerSideEncryption: this.configService.get<string>(
        'STORAGE_SSE_ALGORITHM',
      ) as any,
      SSEKMSKeyId: this.configService.get<string>('STORAGE_SSE_KMS_KEY_ID'),
    });
    const expiresIn = expiresInSeconds ?? this.defaultTtl;
    const url = await getSignedUrl(this.client, command, {
      expiresIn,
    });
    return { url, key, expiresInSeconds: expiresIn };
  }

  async getPresignedDownloadUrl(
    key: string,
    expiresInSeconds?: number,
  ): Promise<string> {
    const command = new GetObjectCommand({
      Bucket: this.bucket,
      Key: key,
    });
    return getSignedUrl(this.client, command, {
      expiresIn: expiresInSeconds ?? this.defaultTtl,
    });
  }

  async getObjectMetadata(key: string): Promise<StorageObjectMetadata | null> {
    try {
      const response = await this.client.send(
        new HeadObjectCommand({ Bucket: this.bucket, Key: key }),
      );
      return {
        key,
        size: response.ContentLength ?? 0,
        contentType: response.ContentType,
        etag: response.ETag,
      };
    } catch (error: any) {
      if (error.name === 'NotFound' || error.name === 'NoSuchKey') {
        return null;
      }
      throw error;
    }
  }

  async getObject(key: string): Promise<Buffer> {
    const response = await this.client.send(
      new GetObjectCommand({ Bucket: this.bucket, Key: key }),
    );
    return this.streamToBuffer(response.Body as Readable);
  }

  async putObject(
    key: string,
    body: Buffer,
    contentType: string,
  ): Promise<void> {
    await this.client.send(
      new PutObjectCommand({
        Bucket: this.bucket,
        Key: key,
        Body: body,
        ContentType: contentType,
        ServerSideEncryption: this.configService.get<string>(
          'STORAGE_SSE_ALGORITHM',
        ) as any,
        SSEKMSKeyId: this.configService.get<string>('STORAGE_SSE_KMS_KEY_ID'),
      }),
    );
  }

  async deleteObject(key: string): Promise<void> {
    await this.client.send(
      new DeleteObjectCommand({ Bucket: this.bucket, Key: key }),
    );
  }

  private streamToBuffer(stream: Readable): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      const chunks: Buffer[] = [];
      stream.on('data', (chunk: Buffer) => chunks.push(chunk));
      stream.on('error', reject);
      stream.on('end', () => resolve(Buffer.concat(chunks)));
    });
  }
}
