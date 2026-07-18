import { IsEnum, IsNotEmpty } from 'class-validator';

export class UpdateMemberRoleDto {
  @IsEnum(['owner', 'admin', 'member', 'dependent'])
  @IsNotEmpty()
  role: 'owner' | 'admin' | 'member' | 'dependent';
}
