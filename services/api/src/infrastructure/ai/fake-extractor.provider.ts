import { Injectable } from '@nestjs/common';
import {
  ExtractedEntities,
  ExtractionResult,
  IExtractorProvider,
} from '../../domain/services/extractor-provider.interface';

@Injectable()
export class FakeExtractorProvider implements IExtractorProvider {
  private result?: ExtractionResult;

  setResult(result: ExtractionResult): void {
    this.result = result;
  }

  async extract(
    documentId: string,
    _buffer: Buffer,
    _contentType: string,
  ): Promise<ExtractionResult> {
    if (this.result) {
      return this.result;
    }
    const generic: ExtractedEntities = {
      documentType: 'generic',
      confidence: 0.92,
      rawText: `extracted text for ${documentId}`,
    };
    return {
      documentType: 'generic',
      confidence: 0.92,
      entities: generic,
      rawText: `extracted text for ${documentId}`,
    };
  }
}
