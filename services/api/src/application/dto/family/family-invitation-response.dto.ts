export class FamilyInvitationResponseDto {
  id: string;
  familyId: string;
  email: string;
  role: string;
  token: string;
  invitedBy: string;
  status: string;
  expiresAt: Date;
  acceptedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}
