import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { GoogleGenerativeAI } from '@google/generative-ai';
import {
  ExtractionResult,
  ExtractedEntitiesSchema,
  IExtractorProvider,
} from '../../domain/services/extractor-provider.interface';
import { ExtractorCircuitBreaker } from './extractor-circuit-breaker.service';

@Injectable()
export class GeminiExtractorProvider implements IExtractorProvider {
  private readonly logger = new Logger(GeminiExtractorProvider.name);

  constructor(
    private readonly configService: ConfigService,
    private readonly circuitBreaker: ExtractorCircuitBreaker,
  ) {}

  async extract(
    documentId: string,
    buffer: Buffer,
    contentType: string,
  ): Promise<ExtractionResult> {
    const apiKey = this.configService.get<string>('GEMINI_API_KEY');
    if (!apiKey) {
      throw new Error('GEMINI_API_KEY is not configured');
    }

    const modelName =
      this.configService.get<string>('GEMINI_MODEL') ??
      'gemini-1.5-flash-latest';
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({
      model: modelName,
      generationConfig: {
        responseMimeType: 'application/json',
      },
    });

    const prompt = this.buildPrompt();

    this.logger.debug('Extracting entities for documentId=%s', documentId);

    const result = await this.circuitBreaker.call(() =>
      model.generateContent([
        prompt,
        {
          inlineData: {
            mimeType: this.safeMimeType(contentType),
            data: buffer.toString('base64'),
          },
        },
      ]),
    );

    const text = result.response.text();
    if (!text) {
      throw new Error('Empty response from Gemini');
    }

    const parsed = JSON.parse(text) as unknown;
    const entities = ExtractedEntitiesSchema.parse(parsed);

    this.logger.debug(
      'Extraction succeeded for documentId=%s documentType=%s confidence=%s',
      documentId,
      entities.documentType,
      entities.confidence,
    );

    return {
      documentType: entities.documentType,
      confidence: entities.confidence,
      entities,
      rawText: entities.rawText,
    };
  }

  private buildPrompt(): string {
    return [
      'Extract structured medical information from the attached document.',
      'Return a single JSON object with documentType, confidence (0.0-1.0), and relevant fields.',
      'Supported documentType values: prescription, lab_report, scan_report, bill, discharge_summary, vaccination_record, insurance, generic.',
      'Common fields: doctorName, hospitalName, visitDate, admissionDate, dischargeDate, followUpDate, diagnosis (array), medications (array of objects with name, dosage, frequency, duration), labTests (array of objects with name, value, unit, referenceRange), findings, impression, totalAmount, items (array of objects with description and amount), vaccineName, administeredDate, administeredBy, providerName, policyNumber, validUntil, rawText.',
      'Use ISO 8601 date strings where possible. Be concise and accurate.',
    ].join(' ');
  }

  private safeMimeType(contentType: string): string {
    // Gemini 1.5 Flash supports common image and PDF MIME types.
    // Coerce HEIC to JPEG if it ever reaches the provider (images are converted earlier).
    if (contentType.includes('heic') || contentType.includes('heif')) {
      return 'image/jpeg';
    }
    return contentType;
  }
}
