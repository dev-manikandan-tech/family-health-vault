import { Inject, Injectable } from '@nestjs/common';
import { AuthError, AuthErrorCode } from '../../domain/errors/auth.error';
import { FamilyRole } from '../../domain/entities/family-member.entity';
import { GrantScope } from '../../domain/entities/record-access-grant.entity';
import { IFamilyMemberRepository } from '../../domain/repositories/family-member.repository.interface';
import { IPatientProfileRepository } from '../../domain/repositories/patient-profile.repository.interface';
import { IRecordAccessGrantRepository } from '../../domain/repositories/record-access-grant.repository.interface';
import {
  FAMILY_MEMBER_REPOSITORY,
  PATIENT_PROFILE_REPOSITORY,
  RECORD_ACCESS_GRANT_REPOSITORY,
} from '../../domain/constants/injection-tokens';

@Injectable()
export class AuthorizationService {
  constructor(
    @Inject(FAMILY_MEMBER_REPOSITORY)
    private readonly familyMemberRepository: IFamilyMemberRepository,
    @Inject(PATIENT_PROFILE_REPOSITORY)
    private readonly patientProfileRepository: IPatientProfileRepository,
    @Inject(RECORD_ACCESS_GRANT_REPOSITORY)
    private readonly grantRepository: IRecordAccessGrantRepository,
  ) {}

  async requireFamilyRole(
    userId: string,
    familyId: string,
    minRole: FamilyRole,
  ): Promise<void> {
    const membership =
      await this.familyMemberRepository.findByFamilyIdAndUserId(
        familyId,
        userId,
      );
    if (!membership || membership.deletedAt || !membership.isAtLeast(minRole)) {
      throw new AuthError(AuthErrorCode.UNAUTHORIZED, 'Forbidden');
    }
  }

  async canManageProfile(userId: string, profileId: string): Promise<boolean> {
    const profile = await this.patientProfileRepository.findById(profileId);
    if (!profile || profile.deletedAt) return false;
    if (profile.userId === userId) return true;
    if (profile.managedByUserId === userId) return true;
    return false;
  }

  async canAccessProfile(
    userId: string,
    profileId: string,
    requiredScope: GrantScope = 'full',
  ): Promise<boolean> {
    const profile = await this.patientProfileRepository.findById(profileId);
    if (!profile || profile.deletedAt) return false;
    if (profile.userId === userId) return true;
    if (profile.managedByUserId === userId) return true;

    const grant = await this.grantRepository.findActiveByGranteeAndProfile(
      userId,
      profileId,
    );
    return grant !== null && grant.isAtLeast(requiredScope);
  }

  async requireProfileAccess(
    userId: string,
    profileId: string,
    requiredScope: GrantScope = 'full',
  ): Promise<void> {
    const allowed = await this.canAccessProfile(
      userId,
      profileId,
      requiredScope,
    );
    if (!allowed) {
      throw new AuthError(AuthErrorCode.UNAUTHORIZED, 'Forbidden');
    }
  }

  async requireProfileManagement(
    userId: string,
    profileId: string,
  ): Promise<void> {
    const allowed = await this.canManageProfile(userId, profileId);
    if (!allowed) {
      throw new AuthError(AuthErrorCode.UNAUTHORIZED, 'Forbidden');
    }
  }

  async getAccessibleProfileIds(userId: string): Promise<string[]> {
    const [owned, managed, memberships, grants] = await Promise.all([
      this.patientProfileRepository.findByUserId(userId),
      this.patientProfileRepository.findByManagedByUserId(userId),
      this.familyMemberRepository.findByUserId(userId),
      this.grantRepository.findActiveByGranteeUserId(userId),
    ]);

    const familyIds = memberships
      .filter((m) => !m.deletedAt)
      .map((m) => m.familyId);
    const familyProfiles = await Promise.all(
      familyIds.map((fid) => this.patientProfileRepository.findByFamilyId(fid)),
    );

    const ids = new Set<string>();
    for (const item of [
      ...owned,
      ...managed,
      ...familyProfiles.flat(),
      ...grants,
    ]) {
      const rawId =
        'patientProfileId' in item
          ? (item as any).patientProfileId
          : (item as any).id;
      const id = typeof rawId === 'string' ? rawId : String(rawId);
      ids.add(id);
    }

    return [...ids];
  }
}
