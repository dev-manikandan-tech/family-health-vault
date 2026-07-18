import { IsObject, IsString } from 'class-validator';

export class UpdateExtractionDto {
  @IsObject()
  extractedEntities: Record<string, unknown>;

  @IsString()
  correctedBy: string;
}
