import { IsString, IsOptional, IsUUID, MaxLength } from 'class-validator';

export class CreateDocumentDto {
  @IsString()
  @MaxLength(255)
  originalName: string;

  @IsString()
  @MaxLength(255)
  contentType: string;

  @IsUUID()
  @IsOptional()
  visitId?: string;
}
