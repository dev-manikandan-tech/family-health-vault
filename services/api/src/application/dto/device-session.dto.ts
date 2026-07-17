import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class DeviceSessionDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  userId: string;

  @ApiPropertyOptional()
  deviceId?: string;

  @ApiPropertyOptional()
  deviceName?: string;

  @ApiPropertyOptional()
  ipAddress?: string;

  @ApiPropertyOptional()
  userAgent?: string;

  @ApiProperty()
  lastActiveAt: Date;

  @ApiProperty()
  createdAt: Date;
}
