import { Injectable } from '@nestjs/common';
import sharp from 'sharp';
import {
  IImageConverter,
  ConvertOptions,
  ThumbnailOptions,
} from '../../domain/services/image-converter.interface';

@Injectable()
export class SharpImageConverter implements IImageConverter {
  private readonly supported = new Set([
    'image/jpeg',
    'image/png',
    'image/webp',
    'image/gif',
    'image/tiff',
  ]);

  supports(mimeType: string): boolean {
    return this.supported.has(mimeType);
  }

  async convert(input: Buffer, options?: ConvertOptions): Promise<Buffer> {
    const format = options?.targetFormat ?? 'jpeg';
    const quality = options?.quality ?? 80;
    let pipeline = sharp(input);
    switch (format) {
      case 'jpeg':
        pipeline = pipeline.jpeg({ quality });
        break;
      case 'png':
        pipeline = pipeline.png();
        break;
      case 'webp':
        pipeline = pipeline.webp({ quality });
        break;
    }
    return pipeline.toBuffer();
  }

  async generateThumbnail(
    input: Buffer,
    options: ThumbnailOptions,
  ): Promise<Buffer> {
    return sharp(input)
      .resize(options.width, options.height, {
        fit: options.fit ?? 'cover',
        withoutEnlargement: true,
      })
      .jpeg({ quality: 80 })
      .toBuffer();
  }

  async getMetadata(
    input: Buffer,
  ): Promise<{ width?: number; height?: number }> {
    const metadata = await sharp(input).metadata();
    return { width: metadata.width, height: metadata.height };
  }
}
