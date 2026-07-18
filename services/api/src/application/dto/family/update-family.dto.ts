import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class UpdateFamilyDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  name: string;
}
