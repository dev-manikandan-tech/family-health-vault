import { IsArray, IsDateString, IsOptional, IsString } from 'class-validator';

export class UpdateVisitDto {
  @IsString()
  @IsOptional()
  title?: string;

  @IsOptional()
  @IsDateString()
  visitedAt?: string;

  @IsString()
  @IsOptional()
  doctorName?: string;

  @IsString()
  @IsOptional()
  hospitalName?: string;

  @IsString()
  @IsOptional()
  diagnosis?: string;

  @IsString()
  @IsOptional()
  notes?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  symptoms?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  medications?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  labTests?: string[];
}
