import { IsString, IsIn, IsOptional } from 'class-validator';

export class CreateNotificationDto {
  @IsString()
  @IsOptional()
  userId?: string;

  @IsString()
  title: string;

  @IsString()
  body: string;

  @IsIn(['in_app', 'email', 'push'])
  channel: 'in_app' | 'email' | 'push';

  @IsString()
  @IsOptional()
  type?: string;
}
