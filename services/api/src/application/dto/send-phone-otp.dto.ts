import { IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class SendPhoneOtpDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  phone: string;
}
