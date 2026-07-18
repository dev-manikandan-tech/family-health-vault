import { Document } from '../entities/document.entity';

export interface IDocumentRepository {
  findById(id: string): Promise<Document | null>;
  findByPatientProfileId(patientProfileId: string): Promise<Document[]>;
  findByVisitId(visitId: string): Promise<Document[]>;
  save(document: Document): Promise<Document>;
  softDelete(id: string): Promise<void>;
}
