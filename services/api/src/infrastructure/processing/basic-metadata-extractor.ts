import { Injectable } from '@nestjs/common';
import { ExtractedMetadata } from '../../domain/entities/document.entity';
import { IMetadataExtractor } from '../../domain/services/metadata-extractor.interface';
import { IImageConverter } from '../../domain/services/image-converter.interface';
import { IMAGE_CONVERTER } from '../../domain/constants/injection-tokens';
import { Inject, Optional } from '@nestjs/common';

@Injectable()
export class BasicMetadataExtractor implements IMetadataExtractor {
  constructor(
    @Optional()
    @Inject(IMAGE_CONVERTER)
    private readonly imageConverter?: IImageConverter,
  ) {}

  async extract(
    documentId: string,
    buffer: Buffer,
    mimeType: string,
  ): Promise<ExtractedMetadata> {
    const metadata: ExtractedMetadata = {
      fileSize: buffer.length,
      mimeType,
      documentId,
    };

    if (this.imageConverter?.supports(mimeType)) {
      try {
        if (typeof this.imageConverter.getMetadata === 'function') {
          const result = this.imageConverter.getMetadata(buffer);
          const { width, height } =
            result instanceof Promise ? await result : result;
          metadata.width = width;
          metadata.height = height;
        }
      } catch {
        // ignore image metadata extraction failures
      }
    }

    return metadata;
  }
}
