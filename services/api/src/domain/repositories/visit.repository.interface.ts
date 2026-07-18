import { Visit } from '../entities/visit.entity';

export interface IVisitRepository {
  findById(id: string): Promise<Visit | null>;
  findByPatientProfileId(patientProfileId: string): Promise<Visit[]>;
  save(visit: Visit): Promise<Visit>;
  softDelete(id: string): Promise<void>;
  restore(id: string): Promise<void>;
}
