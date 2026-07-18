export class PatientProfileResponseDto {
  id: string;
  userId?: string;
  familyId?: string;
  name: string;
  dob?: Date;
  sex?: string;
  bloodGroup?: string;
  allergies: string[];
  abhaId?: string;
  managedByUserId?: string;
  createdAt: Date;
  updatedAt: Date;
}
