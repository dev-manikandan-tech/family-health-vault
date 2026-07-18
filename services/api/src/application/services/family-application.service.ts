import { Inject, Injectable } from '@nestjs/common';
import { AuthError, AuthErrorCode } from '../../domain/errors/auth.error';
import { Family } from '../../domain/entities/family.entity';
import {
  FamilyMember,
  FamilyRole,
} from '../../domain/entities/family-member.entity';
import { FamilyInvitation } from '../../domain/entities/family-invitation.entity';
import { PatientProfile } from '../../domain/entities/patient-profile.entity';
import { IAuditService } from '../../domain/services/audit-service.interface';
import { IFamilyRepository } from '../../domain/repositories/family.repository.interface';
import { IFamilyMemberRepository } from '../../domain/repositories/family-member.repository.interface';
import { IFamilyInvitationRepository } from '../../domain/repositories/family-invitation.repository.interface';
import { IPatientProfileRepository } from '../../domain/repositories/patient-profile.repository.interface';
import { IUserRepository } from '../../domain/repositories/user.repository.interface';
import {
  FAMILY_REPOSITORY,
  FAMILY_MEMBER_REPOSITORY,
  FAMILY_INVITATION_REPOSITORY,
  PATIENT_PROFILE_REPOSITORY,
  AUDIT_SERVICE,
  USER_REPOSITORY,
} from '../../domain/constants/injection-tokens';
import { DeviceInfo } from './auth-application.service';
import {
  AcceptInvitationDto,
  CreateFamilyDto,
  FamilyInvitationResponseDto,
  FamilyMemberResponseDto,
  FamilyResponseDto,
  InviteMemberDto,
  PaginationQueryDto,
  UpdateFamilyDto,
  UpdateMemberRoleDto,
} from '../dto';

@Injectable()
export class FamilyApplicationService {
  constructor(
    @Inject(FAMILY_REPOSITORY)
    private readonly familyRepository: IFamilyRepository,
    @Inject(FAMILY_MEMBER_REPOSITORY)
    private readonly familyMemberRepository: IFamilyMemberRepository,
    @Inject(FAMILY_INVITATION_REPOSITORY)
    private readonly familyInvitationRepository: IFamilyInvitationRepository,
    @Inject(PATIENT_PROFILE_REPOSITORY)
    private readonly patientProfileRepository: IPatientProfileRepository,
    @Inject(USER_REPOSITORY)
    private readonly userRepository: IUserRepository,
    @Inject(AUDIT_SERVICE)
    private readonly auditService: IAuditService,
  ) {}

  async createFamily(
    userId: string,
    dto: CreateFamilyDto,
    deviceInfo: DeviceInfo,
  ): Promise<FamilyResponseDto> {
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new AuthError(AuthErrorCode.USER_NOT_FOUND, 'User not found');
    }

    const family = await this.familyRepository.save(
      new Family({ name: dto.name, createdBy: userId }),
    );

    const ownerMember = await this.familyMemberRepository.save(
      new FamilyMember({
        familyId: family.id,
        userId,
        email: user.email,
        role: 'owner',
        joinedAt: new Date(),
      }),
    );

    const ownerProfile = await this.patientProfileRepository.save(
      new PatientProfile({
        userId,
        familyId: family.id,
        name: dto.name, // Owner profile defaults to family name; UI should update later.
        managedByUserId: userId,
      }),
    );

    await this.auditService.log({
      action: 'FAMILY_CREATED',
      resourceType: 'family',
      resourceId: family.id,
      actorId: userId,
      ip: deviceInfo.ipAddress,
      userAgent: deviceInfo.userAgent,
      familyId: family.id,
      patientProfileId: ownerProfile.id,
      metadata: { ownerMemberId: ownerMember.id },
    });

    await this.auditService.log({
      action: 'PROFILE_CREATED',
      resourceType: 'patient_profile',
      resourceId: ownerProfile.id,
      actorId: userId,
      ip: deviceInfo.ipAddress,
      userAgent: deviceInfo.userAgent,
      familyId: family.id,
      patientProfileId: ownerProfile.id,
      metadata: { isSelf: true },
    });

    return this.toFamilyResponse(family, 1);
  }

  async inviteMember(
    userId: string,
    familyId: string,
    dto: InviteMemberDto,
    deviceInfo: DeviceInfo,
  ): Promise<FamilyInvitationResponseDto> {
    await this.requireFamilyRole(userId, familyId, 'admin');

    const existingMember =
      await this.familyMemberRepository.findByFamilyIdAndEmail(
        familyId,
        dto.email,
      );
    if (existingMember && !existingMember.deletedAt) {
      throw new AuthError(
        AuthErrorCode.ALREADY_MEMBER,
        'User is already a member',
      );
    }

    const existingInvitation =
      await this.familyInvitationRepository.findPendingByFamilyIdAndEmail(
        familyId,
        dto.email,
      );
    if (existingInvitation) {
      throw new AuthError(
        AuthErrorCode.PENDING_INVITATION_EXISTS,
        'Pending invitation already exists',
      );
    }

    const invitation = await this.familyInvitationRepository.save(
      new FamilyInvitation({
        familyId,
        email: dto.email,
        role: dto.role,
        invitedBy: userId,
      }),
    );

    await this.auditService.log({
      action: 'MEMBER_INVITED',
      resourceType: 'family_invitation',
      resourceId: invitation.id,
      actorId: userId,
      familyId,
      ip: deviceInfo.ipAddress,
      userAgent: deviceInfo.userAgent,
      metadata: { email: dto.email, role: dto.role },
    });

    return this.toInvitationResponse(invitation);
  }

  async acceptInvitation(
    userId: string,
    dto: AcceptInvitationDto,
    deviceInfo: DeviceInfo,
  ): Promise<FamilyMemberResponseDto> {
    const invitation = await this.familyInvitationRepository.findByToken(
      dto.token,
    );
    if (!invitation || invitation.deletedAt) {
      throw new AuthError(
        AuthErrorCode.INVITATION_NOT_FOUND,
        'Invitation not found',
      );
    }
    if (invitation.status !== 'pending' || invitation.isExpired()) {
      throw new AuthError(
        AuthErrorCode.INVALID_INVITATION,
        'Invitation is expired or already used',
      );
    }

    const existing = await this.familyMemberRepository.findByFamilyIdAndUserId(
      invitation.familyId,
      userId,
    );
    if (existing && !existing.deletedAt) {
      throw new AuthError(AuthErrorCode.ALREADY_MEMBER, 'Already a member');
    }

    let profile: PatientProfile | undefined;
    if (invitation.role === 'dependent') {
      profile = await this.patientProfileRepository.save(
        new PatientProfile({
          familyId: invitation.familyId,
          name: dto.name,
          managedByUserId: userId,
        }),
      );
    }

    const member = await this.familyMemberRepository.save(
      new FamilyMember({
        familyId: invitation.familyId,
        userId,
        email: invitation.email,
        name: dto.name,
        role: invitation.role as FamilyRole,
        joinedAt: new Date(),
      }),
    );

    invitation.accept();
    await this.familyInvitationRepository.save(invitation);

    await this.auditService.log({
      action: 'INVITATION_ACCEPTED',
      resourceType: 'family_invitation',
      resourceId: invitation.id,
      actorId: userId,
      familyId: invitation.familyId,
      ip: deviceInfo.ipAddress,
      userAgent: deviceInfo.userAgent,
      metadata: { memberId: member.id, role: member.role },
    });

    if (profile) {
      await this.auditService.log({
        action: 'PROFILE_CREATED',
        resourceType: 'patient_profile',
        resourceId: profile.id,
        actorId: userId,
        familyId: invitation.familyId,
        patientProfileId: profile.id,
        metadata: { isDependent: true },
      });
    }

    return this.toMemberResponse(member);
  }

  async listFamilies(
    userId: string,
    query: PaginationQueryDto,
  ): Promise<{ data: FamilyResponseDto[]; total: number }> {
    const memberships = await this.familyMemberRepository.findByUserId(userId);
    const familyIds = memberships
      .filter((m) => !m.deletedAt)
      .map((m) => m.familyId);

    if (familyIds.length === 0) return { data: [], total: 0 };

    const families = await this.familyRepository.findByIds(familyIds);
    const visibleFamilies = families.filter((f) => !f.deletedAt);

    let filtered = visibleFamilies;
    if (query.search) {
      const term = query.search.toLowerCase();
      filtered = visibleFamilies.filter((f) =>
        f.name.toLowerCase().includes(term),
      );
    }

    const sorted = filtered.sort(
      (a, b) => b.createdAt.getTime() - a.createdAt.getTime(),
    );
    const total = sorted.length;
    const paginated = sorted.slice(query.offset, query.offset + query.limit);

    const counts = await this.memberCounts(paginated.map((f) => f.id));

    return {
      data: paginated.map((f) => this.toFamilyResponse(f, counts[f.id] ?? 0)),
      total,
    };
  }

  async getFamily(
    userId: string,
    familyId: string,
  ): Promise<FamilyResponseDto> {
    const membership =
      await this.familyMemberRepository.findByFamilyIdAndUserId(
        familyId,
        userId,
      );
    if (!membership || membership.deletedAt) {
      throw new AuthError(AuthErrorCode.FAMILY_NOT_FOUND, 'Family not found');
    }

    const family = await this.familyRepository.findById(familyId);
    if (!family || family.deletedAt) {
      throw new AuthError(AuthErrorCode.FAMILY_NOT_FOUND, 'Family not found');
    }

    const count = (
      await this.familyMemberRepository.findByFamilyId(familyId)
    ).filter((m) => !m.deletedAt).length;

    return this.toFamilyResponse(family, count);
  }

  async updateFamily(
    userId: string,
    familyId: string,
    dto: UpdateFamilyDto,
    deviceInfo: DeviceInfo,
  ): Promise<FamilyResponseDto> {
    await this.requireFamilyRole(userId, familyId, 'admin');
    const family = await this.familyRepository.findById(familyId);
    if (!family || family.deletedAt) {
      throw new AuthError(AuthErrorCode.FAMILY_NOT_FOUND, 'Family not found');
    }

    family.rename(dto.name);
    const saved = await this.familyRepository.save(family);

    await this.auditService.log({
      action: 'FAMILY_UPDATED',
      resourceType: 'family',
      resourceId: familyId,
      actorId: userId,
      familyId,
      ip: deviceInfo.ipAddress,
      userAgent: deviceInfo.userAgent,
      metadata: { name: dto.name },
    });

    return this.toFamilyResponse(saved);
  }

  async deleteFamily(
    userId: string,
    familyId: string,
    deviceInfo: DeviceInfo,
  ): Promise<void> {
    await this.requireFamilyRole(userId, familyId, 'owner');
    const family = await this.familyRepository.findById(familyId);
    if (!family || family.deletedAt) {
      throw new AuthError(AuthErrorCode.FAMILY_NOT_FOUND, 'Family not found');
    }

    await this.familyRepository.softDelete(familyId);
    await this.familyMemberRepository.softDeleteByFamilyId(familyId);
    await this.familyInvitationRepository.softDeleteByFamilyId(familyId);
    await this.patientProfileRepository.softDeleteByFamilyId(familyId);

    await this.auditService.log({
      action: 'FAMILY_DELETED',
      resourceType: 'family',
      resourceId: familyId,
      actorId: userId,
      familyId,
      ip: deviceInfo.ipAddress,
      userAgent: deviceInfo.userAgent,
    });
  }

  async listMembers(
    userId: string,
    familyId: string,
    query: PaginationQueryDto,
  ): Promise<{ data: FamilyMemberResponseDto[]; total: number }> {
    await this.requireFamilyRole(userId, familyId, 'member');
    const members = (
      await this.familyMemberRepository.findByFamilyId(familyId)
    ).filter((m) => !m.deletedAt);

    let filtered = members;
    if (query.search) {
      const term = query.search.toLowerCase();
      filtered = members.filter(
        (m) =>
          (m.email?.toLowerCase().includes(term) ?? false) ||
          (m.name?.toLowerCase().includes(term) ?? false),
      );
    }

    const sorted = filtered.sort(
      (a, b) => b.createdAt.getTime() - a.createdAt.getTime(),
    );
    const total = sorted.length;
    const paginated = sorted.slice(query.offset, query.offset + query.limit);

    return {
      data: paginated.map((m) => this.toMemberResponse(m)),
      total,
    };
  }

  async updateMemberRole(
    userId: string,
    familyId: string,
    memberId: string,
    dto: UpdateMemberRoleDto,
    deviceInfo: DeviceInfo,
  ): Promise<FamilyMemberResponseDto> {
    await this.requireFamilyRole(userId, familyId, 'admin');

    if (dto.role === 'owner') {
      throw new AuthError(
        AuthErrorCode.CANNOT_TRANSFER_OWNERSHIP,
        'Ownership cannot be transferred through role update',
      );
    }

    const member = await this.familyMemberRepository.findById(memberId);
    if (!member || member.deletedAt || member.familyId !== familyId) {
      throw new AuthError(AuthErrorCode.MEMBER_NOT_FOUND, 'Member not found');
    }

    if (member.role === 'owner') {
      throw new AuthError(
        AuthErrorCode.CANNOT_MODIFY_OWNER,
        'Owner role cannot be modified',
      );
    }

    member.updateRole(dto.role);
    const saved = await this.familyMemberRepository.save(member);

    await this.auditService.log({
      action: 'MEMBER_ROLE_UPDATED',
      resourceType: 'family_member',
      resourceId: memberId,
      actorId: userId,
      familyId,
      ip: deviceInfo.ipAddress,
      userAgent: deviceInfo.userAgent,
      metadata: { newRole: dto.role },
    });

    return this.toMemberResponse(saved);
  }

  async removeMember(
    userId: string,
    familyId: string,
    memberId: string,
    deviceInfo: DeviceInfo,
  ): Promise<void> {
    await this.requireFamilyRole(userId, familyId, 'admin');

    const member = await this.familyMemberRepository.findById(memberId);
    if (!member || member.deletedAt || member.familyId !== familyId) {
      throw new AuthError(AuthErrorCode.MEMBER_NOT_FOUND, 'Member not found');
    }

    if (member.role === 'owner') {
      throw new AuthError(
        AuthErrorCode.CANNOT_REMOVE_OWNER,
        'Owner cannot be removed',
      );
    }

    if (member.userId === userId) {
      throw new AuthError(
        AuthErrorCode.CANNOT_REMOVE_SELF,
        'You cannot remove yourself',
      );
    }

    await this.familyMemberRepository.softDelete(memberId);

    await this.auditService.log({
      action: 'MEMBER_REMOVED',
      resourceType: 'family_member',
      resourceId: memberId,
      actorId: userId,
      familyId,
      ip: deviceInfo.ipAddress,
      userAgent: deviceInfo.userAgent,
      metadata: { role: member.role },
    });
  }

  private async requireFamilyRole(
    userId: string,
    familyId: string,
    minRole: FamilyRole,
  ): Promise<FamilyMember> {
    const membership =
      await this.familyMemberRepository.findByFamilyIdAndUserId(
        familyId,
        userId,
      );
    if (!membership || membership.deletedAt || !membership.isAtLeast(minRole)) {
      throw new AuthError(AuthErrorCode.UNAUTHORIZED, 'Forbidden');
    }
    return membership;
  }

  private async memberCounts(
    familyIds: string[],
  ): Promise<Record<string, number>> {
    const counts: Record<string, number> = {};
    for (const id of familyIds) {
      const members = (
        await this.familyMemberRepository.findByFamilyId(id)
      ).filter((m) => !m.deletedAt);
      counts[id] = members.length;
    }
    return counts;
  }

  private toFamilyResponse(
    family: Family,
    memberCount?: number,
  ): FamilyResponseDto {
    return {
      id: family.id,
      name: family.name,
      createdBy: family.createdBy,
      memberCount,
      createdAt: family.createdAt,
      updatedAt: family.updatedAt,
    };
  }

  private toMemberResponse(member: FamilyMember): FamilyMemberResponseDto {
    return {
      id: member.id,
      familyId: member.familyId,
      userId: member.userId,
      email: member.email,
      name: member.name,
      role: member.role,
      joinedAt: member.joinedAt,
      createdAt: member.createdAt,
      updatedAt: member.updatedAt,
    };
  }

  private toInvitationResponse(
    invitation: FamilyInvitation,
  ): FamilyInvitationResponseDto {
    return {
      id: invitation.id,
      familyId: invitation.familyId,
      email: invitation.email,
      role: invitation.role,
      token: invitation.token,
      invitedBy: invitation.invitedBy,
      status: invitation.status,
      expiresAt: invitation.expiresAt,
      acceptedAt: invitation.acceptedAt,
      createdAt: invitation.createdAt,
      updatedAt: invitation.updatedAt,
    };
  }
}
