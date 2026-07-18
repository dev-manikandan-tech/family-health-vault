import { PatientProfile } from '../entities/patient-profile.entity';

export interface IPatientProfileRepository {
  findById(id: string): Promise<PatientProfile | null>;
  findByUserId(userId: string): Promise<PatientProfile[]>;
  findByFamilyId(familyId: string): Promise<PatientProfile[]>;
  findByManagedByUserId(userId: string): Promise<PatientProfile[]>;
  findByIds(ids: string[]): Promise<PatientProfile[]>;
  save(profile: PatientProfile): Promise<PatientProfile>;
  softDelete(id: string): Promise<void>;
  softDeleteByFamilyId(familyId: string): Promise<void>;
}
