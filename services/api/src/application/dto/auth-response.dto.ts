import { IsString, IsNumber, IsObject } from 'class-validator';

export class AuthUserDto {
  @IsString()
  id: string;

  @IsString()
  email: string;

  @IsString()
  authProvider: string;
}

export class AuthResponseDto {
  @IsString()
  accessToken: string;

  @IsString()
  refreshToken: string;

  @IsNumber()
  expiresIn: number;

  @IsObject()
  user: AuthUserDto;
}
