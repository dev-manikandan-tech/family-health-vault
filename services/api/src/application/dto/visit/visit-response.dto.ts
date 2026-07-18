export class VisitResponseDto {
  id: string;
  patientProfileId: string;
  familyId?: string;
  title?: string;
  visitedAt: Date;
  doctorName?: string;
  hospitalName?: string;
  diagnosis?: string;
  notes?: string;
  symptoms: string[];
  medications: string[];
  labTests: string[];
  createdAt: Date;
  updatedAt: Date;
}
