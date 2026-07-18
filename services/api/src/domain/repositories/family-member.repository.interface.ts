import { FamilyMember, FamilyRole } from '../entities/family-member.entity';

export interface IFamilyMemberRepository {
  findById(id: string): Promise<FamilyMember | null>;
  findByFamilyId(familyId: string): Promise<FamilyMember[]>;
  findByFamilyIdAndUserId(
    familyId: string,
    userId: string,
  ): Promise<FamilyMember | null>;
  findByUserId(userId: string): Promise<FamilyMember[]>;
  findByFamilyIdAndEmail(
    familyId: string,
    email: string,
  ): Promise<FamilyMember | null>;
  findByFamilyIdAndRole(
    familyId: string,
    role: FamilyRole,
  ): Promise<FamilyMember[]>;
  save(member: FamilyMember): Promise<FamilyMember>;
  softDelete(id: string): Promise<void>;
  softDeleteByFamilyId(familyId: string): Promise<void>;
}
