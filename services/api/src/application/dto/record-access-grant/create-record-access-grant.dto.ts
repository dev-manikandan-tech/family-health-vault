import {
  IsDateString,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
} from 'class-validator';

export class CreateRecordAccessGrantDto {
  @IsString()
  @IsNotEmpty()
  granteeUserId: string;

  @IsEnum(['full', 'visits_only', 'emergency_card'])
  scope: 'full' | 'visits_only' | 'emergency_card';

  @IsOptional()
  @IsDateString()
  expiresAt?: string;
}
