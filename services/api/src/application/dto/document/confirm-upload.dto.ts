import { IsInt, IsPositive, IsString, IsOptional } from 'class-validator';

export class ConfirmUploadDto {
  @IsInt()
  @IsPositive()
  size: number;

  @IsString()
  @IsOptional()
  checksum?: string;
}
