import { Inject, Injectable } from '@nestjs/common';
import { AuthError, AuthErrorCode } from '../../domain/errors/auth.error';
import { RecordAccessGrant } from '../../domain/entities/record-access-grant.entity';
import { IAuditService } from '../../domain/services/audit-service.interface';
import { IRecordAccessGrantRepository } from '../../domain/repositories/record-access-grant.repository.interface';
import { IPatientProfileRepository } from '../../domain/repositories/patient-profile.repository.interface';
import {
  AUDIT_SERVICE,
  PATIENT_PROFILE_REPOSITORY,
  RECORD_ACCESS_GRANT_REPOSITORY,
} from '../../domain/constants/injection-tokens';
import { AuthorizationService } from './authorization.service';
import { DeviceInfo } from './auth-application.service';
import {
  CreateRecordAccessGrantDto,
  RecordAccessGrantResponseDto,
} from '../dto';

@Injectable()
export class RecordAccessGrantApplicationService {
  constructor(
    @Inject(RECORD_ACCESS_GRANT_REPOSITORY)
    private readonly grantRepository: IRecordAccessGrantRepository,
    @Inject(PATIENT_PROFILE_REPOSITORY)
    private readonly patientProfileRepository: IPatientProfileRepository,
    @Inject(AUDIT_SERVICE)
    private readonly auditService: IAuditService,
    private readonly authorizationService: AuthorizationService,
  ) {}

  async createGrant(
    userId: string,
    profileId: string,
    dto: CreateRecordAccessGrantDto,
    deviceInfo: DeviceInfo,
  ): Promise<RecordAccessGrantResponseDto> {
    await this.authorizationService.requireProfileManagement(userId, profileId);

    const profile = await this.patientProfileRepository.findById(profileId);
    if (!profile || profile.deletedAt) {
      throw new AuthError(AuthErrorCode.PROFILE_NOT_FOUND, 'Profile not found');
    }

    const grant = new RecordAccessGrant({
      patientProfileId: profileId,
      granteeUserId: dto.granteeUserId,
      scope: dto.scope,
      grantedBy: userId,
      expiresAt: dto.expiresAt ? new Date(dto.expiresAt) : undefined,
    });

    const saved = await this.grantRepository.save(grant);

    await this.auditService.log({
      action: 'GRANT_CREATED',
      resourceType: 'record_access_grant',
      resourceId: saved.id,
      actorId: userId,
      patientProfileId: profileId,
      familyId: profile.familyId,
      ip: deviceInfo.ipAddress,
      userAgent: deviceInfo.userAgent,
      metadata: { granteeUserId: dto.granteeUserId, scope: dto.scope },
    });

    return this.toResponse(saved);
  }

  async listGrants(
    userId: string,
    profileId: string,
  ): Promise<RecordAccessGrantResponseDto[]> {
    const canManage = await this.authorizationService.canManageProfile(
      userId,
      profileId,
    );
    if (!canManage) {
      throw new AuthError(AuthErrorCode.UNAUTHORIZED, 'Forbidden');
    }

    const grants = await this.grantRepository.findByPatientProfileId(profileId);
    return grants.filter((g) => !g.deletedAt).map((g) => this.toResponse(g));
  }

  async revokeGrant(
    userId: string,
    grantId: string,
    deviceInfo: DeviceInfo,
  ): Promise<void> {
    const grant = await this.grantRepository.findById(grantId);
    if (!grant || grant.deletedAt) {
      throw new AuthError(AuthErrorCode.GRANT_NOT_FOUND, 'Grant not found');
    }

    const profile = await this.patientProfileRepository.findById(
      grant.patientProfileId,
    );
    if (!profile || profile.deletedAt) {
      throw new AuthError(AuthErrorCode.PROFILE_NOT_FOUND, 'Profile not found');
    }

    const canManage = await this.authorizationService.canManageProfile(
      userId,
      grant.patientProfileId,
    );
    if (!canManage && grant.grantedBy !== userId) {
      throw new AuthError(AuthErrorCode.UNAUTHORIZED, 'Forbidden');
    }

    await this.grantRepository.revoke(grantId);

    await this.auditService.log({
      action: 'GRANT_REVOKED',
      resourceType: 'record_access_grant',
      resourceId: grantId,
      actorId: userId,
      patientProfileId: grant.patientProfileId,
      familyId: profile.familyId,
      ip: deviceInfo.ipAddress,
      userAgent: deviceInfo.userAgent,
    });
  }

  private toResponse(grant: RecordAccessGrant): RecordAccessGrantResponseDto {
    return {
      id: grant.id,
      patientProfileId: grant.patientProfileId,
      granteeUserId: grant.granteeUserId,
      scope: grant.scope,
      grantedBy: grant.grantedBy,
      expiresAt: grant.expiresAt,
      createdAt: grant.createdAt,
      updatedAt: grant.updatedAt,
    };
  }
}
