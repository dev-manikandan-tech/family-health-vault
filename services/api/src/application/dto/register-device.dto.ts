import { IsOptional, IsString } from 'class-validator';

export class RegisterDeviceDto {
  @IsOptional()
  @IsString()
  deviceId?: string;

  @IsOptional()
  @IsString()
  deviceName?: string;
}
