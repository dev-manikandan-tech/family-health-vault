import { ExtractedMetadata } from '../entities/document.entity';

export interface IMetadataExtractor {
  extract(
    documentId: string,
    buffer: Buffer,
    mimeType: string,
  ): Promise<ExtractedMetadata>;
}
