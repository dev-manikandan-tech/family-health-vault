import { IsString, IsBoolean } from 'class-validator';

export class UserProfileDto {
  @IsString()
  id: string;

  @IsString()
  email: string;

  @IsString()
  authProvider: string;

  @IsBoolean()
  emailVerified: boolean;

  @IsBoolean()
  mfaEnabled: boolean;
}
