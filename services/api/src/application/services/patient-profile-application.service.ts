import { Inject, Injectable } from '@nestjs/common';
import { AuthError, AuthErrorCode } from '../../domain/errors/auth.error';
import { PatientProfile } from '../../domain/entities/patient-profile.entity';
import { IAuditService } from '../../domain/services/audit-service.interface';
import { IPatientProfileRepository } from '../../domain/repositories/patient-profile.repository.interface';
import { IRecordAccessGrantRepository } from '../../domain/repositories/record-access-grant.repository.interface';
import {
  PATIENT_PROFILE_REPOSITORY,
  RECORD_ACCESS_GRANT_REPOSITORY,
  AUDIT_SERVICE,
} from '../../domain/constants/injection-tokens';
import { AuthorizationService } from './authorization.service';
import { DeviceInfo } from './auth-application.service';
import {
  CreatePatientProfileDto,
  PatientProfileResponseDto,
  PaginationQueryDto,
  UpdatePatientProfileDto,
} from '../dto';

@Injectable()
export class PatientProfileApplicationService {
  constructor(
    @Inject(PATIENT_PROFILE_REPOSITORY)
    private readonly patientProfileRepository: IPatientProfileRepository,
    @Inject(RECORD_ACCESS_GRANT_REPOSITORY)
    private readonly grantRepository: IRecordAccessGrantRepository,
    @Inject(AUDIT_SERVICE)
    private readonly auditService: IAuditService,
    private readonly authorizationService: AuthorizationService,
  ) {}

  async createProfile(
    userId: string,
    dto: CreatePatientProfileDto,
    deviceInfo: DeviceInfo,
  ): Promise<PatientProfileResponseDto> {
    const profile = new PatientProfile({
      userId: dto.userId ?? undefined,
      familyId: dto.familyId ?? undefined,
      name: dto.name,
      dob: dto.dob ? new Date(dto.dob) : undefined,
      sex: dto.sex,
      bloodGroup: dto.bloodGroup,
      allergies: dto.allergies,
      abhaId: dto.abhaId,
      managedByUserId: userId,
    });

    if (dto.familyId && !dto.userId) {
      await this.authorizationService.requireFamilyRole(
        userId,
        dto.familyId,
        'member',
      );
    }

    const saved = await this.patientProfileRepository.save(profile);

    await this.auditService.log({
      action: 'PROFILE_CREATED',
      resourceType: 'patient_profile',
      resourceId: saved.id,
      actorId: userId,
      ip: deviceInfo.ipAddress,
      userAgent: deviceInfo.userAgent,
      familyId: saved.familyId,
      patientProfileId: saved.id,
      metadata: { familyId: saved.familyId, userId: saved.userId },
    });

    return this.toResponse(saved);
  }

  async listProfiles(
    userId: string,
    query: PaginationQueryDto,
  ): Promise<{ data: PatientProfileResponseDto[]; total: number }> {
    const own = await this.patientProfileRepository.findByUserId(userId);
    const managed = (await this.findManagedProfiles(userId)).filter(
      (p) => !own.find((o) => o.id === p.id),
    );
    const granted = (await this.findGrantedProfiles(userId)).filter(
      (p) =>
        !own.find((o) => o.id === p.id) && !managed.find((m) => m.id === p.id),
    );

    const combined = [...own, ...managed, ...granted].filter(
      (p) => !p.deletedAt,
    );

    let filtered = combined;
    if (query.search) {
      const term = query.search.toLowerCase();
      filtered = combined.filter((p) => p.name.toLowerCase().includes(term));
    }

    const sorted = filtered.sort(
      (a, b) => b.createdAt.getTime() - a.createdAt.getTime(),
    );
    const total = sorted.length;
    const paginated = sorted.slice(query.offset, query.offset + query.limit);

    return { data: paginated.map((p) => this.toResponse(p)), total };
  }

  async getProfile(
    userId: string,
    profileId: string,
  ): Promise<PatientProfileResponseDto> {
    await this.authorizationService.requireProfileAccess(
      userId,
      profileId,
      'emergency_card',
    );
    const profile = await this.patientProfileRepository.findById(profileId);
    if (!profile || profile.deletedAt) {
      throw new AuthError(AuthErrorCode.PROFILE_NOT_FOUND, 'Profile not found');
    }

    await this.auditService.log({
      action: 'PROFILE_ACCESSED',
      resourceType: 'patient_profile',
      resourceId: profileId,
      actorId: userId,
      patientProfileId: profileId,
      metadata: { accessType: 'read' },
    });

    return this.toResponse(profile);
  }

  async updateProfile(
    userId: string,
    profileId: string,
    dto: UpdatePatientProfileDto,
    deviceInfo: DeviceInfo,
  ): Promise<PatientProfileResponseDto> {
    const canManage = await this.authorizationService.canManageProfile(
      userId,
      profileId,
    );
    const canGrant = await this.authorizationService.canAccessProfile(
      userId,
      profileId,
      'full',
    );
    if (!canManage && !canGrant) {
      throw new AuthError(AuthErrorCode.UNAUTHORIZED, 'Forbidden');
    }

    const profile = await this.patientProfileRepository.findById(profileId);
    if (!profile || profile.deletedAt) {
      throw new AuthError(AuthErrorCode.PROFILE_NOT_FOUND, 'Profile not found');
    }

    profile.update({
      name: dto.name,
      dob: dto.dob ? new Date(dto.dob) : undefined,
      sex: dto.sex,
      bloodGroup: dto.bloodGroup,
      allergies: dto.allergies,
      abhaId: dto.abhaId,
      managedByUserId: dto.managedByUserId,
    });

    const saved = await this.patientProfileRepository.save(profile);

    await this.auditService.log({
      action: 'PROFILE_UPDATED',
      resourceType: 'patient_profile',
      resourceId: saved.id,
      actorId: userId,
      ip: deviceInfo.ipAddress,
      userAgent: deviceInfo.userAgent,
      familyId: saved.familyId,
      patientProfileId: saved.id,
      metadata: { fields: Object.keys(dto) },
    });

    return this.toResponse(saved);
  }

  async deleteProfile(
    userId: string,
    profileId: string,
    deviceInfo: DeviceInfo,
  ): Promise<void> {
    await this.authorizationService.requireProfileManagement(userId, profileId);
    const profile = await this.patientProfileRepository.findById(profileId);
    if (!profile || profile.deletedAt) {
      throw new AuthError(AuthErrorCode.PROFILE_NOT_FOUND, 'Profile not found');
    }

    await this.patientProfileRepository.softDelete(profileId);

    await this.auditService.log({
      action: 'PROFILE_DELETED',
      resourceType: 'patient_profile',
      resourceId: profileId,
      actorId: userId,
      ip: deviceInfo.ipAddress,
      userAgent: deviceInfo.userAgent,
      familyId: profile.familyId,
      patientProfileId: profileId,
    });
  }

  private async findManagedProfiles(userId: string): Promise<PatientProfile[]> {
    return this.patientProfileRepository.findByManagedByUserId(userId);
  }

  private async findGrantedProfiles(userId: string): Promise<PatientProfile[]> {
    const grants = await this.grantRepository.findActiveByGranteeUserId(userId);
    const profileIds = grants.map((g) => g.patientProfileId);
    if (profileIds.length === 0) return [];
    return this.patientProfileRepository.findByIds(profileIds);
  }

  private toResponse(profile: PatientProfile): PatientProfileResponseDto {
    return {
      id: profile.id,
      userId: profile.userId,
      familyId: profile.familyId,
      name: profile.name,
      dob: profile.dob,
      sex: profile.sex,
      bloodGroup: profile.bloodGroup,
      allergies: profile.allergies,
      abhaId: profile.abhaId,
      managedByUserId: profile.managedByUserId,
      createdAt: profile.createdAt,
      updatedAt: profile.updatedAt,
    };
  }
}
