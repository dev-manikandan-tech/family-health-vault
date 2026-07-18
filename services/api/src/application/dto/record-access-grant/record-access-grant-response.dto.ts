export class RecordAccessGrantResponseDto {
  id: string;
  patientProfileId: string;
  granteeUserId: string;
  scope: string;
  grantedBy: string;
  expiresAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}
