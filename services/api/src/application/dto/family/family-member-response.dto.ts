export class FamilyMemberResponseDto {
  id: string;
  familyId: string;
  userId?: string;
  email?: string;
  name?: string;
  role: string;
  joinedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}
