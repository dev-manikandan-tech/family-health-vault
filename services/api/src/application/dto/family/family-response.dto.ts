export class FamilyResponseDto {
  id: string;
  name: string;
  createdBy: string;
  memberCount?: number;
  createdAt: Date;
  updatedAt: Date;
}
