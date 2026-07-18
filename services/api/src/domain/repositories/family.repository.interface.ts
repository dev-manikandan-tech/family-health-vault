import { Family } from '../entities/family.entity';

export interface IFamilyRepository {
  findById(id: string): Promise<Family | null>;
  findByIds(ids: string[]): Promise<Family[]>;
  findByCreatedBy(userId: string): Promise<Family[]>;
  save(family: Family): Promise<Family>;
  softDelete(id: string): Promise<void>;
}
