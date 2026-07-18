import { FamilyInvitation } from '../entities/family-invitation.entity';

export interface IFamilyInvitationRepository {
  findById(id: string): Promise<FamilyInvitation | null>;
  findByToken(token: string): Promise<FamilyInvitation | null>;
  findByFamilyId(familyId: string): Promise<FamilyInvitation[]>;
  findPendingByFamilyIdAndEmail(
    familyId: string,
    email: string,
  ): Promise<FamilyInvitation | null>;
  save(invitation: FamilyInvitation): Promise<FamilyInvitation>;
  softDelete(id: string): Promise<void>;
  softDeleteByFamilyId(familyId: string): Promise<void>;
}
