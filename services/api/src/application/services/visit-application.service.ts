import { Inject, Injectable } from '@nestjs/common';
import { AuthError, AuthErrorCode } from '../../domain/errors/auth.error';
import { Visit } from '../../domain/entities/visit.entity';
import { IAuditService } from '../../domain/services/audit-service.interface';
import { IVisitRepository } from '../../domain/repositories/visit.repository.interface';
import { IPatientProfileRepository } from '../../domain/repositories/patient-profile.repository.interface';
import {
  AUDIT_SERVICE,
  PATIENT_PROFILE_REPOSITORY,
  VISIT_REPOSITORY,
} from '../../domain/constants/injection-tokens';
import { AuthorizationService } from './authorization.service';
import { TimelineApplicationService } from './timeline-application.service';
import { DeviceInfo } from './auth-application.service';
import {
  CreateVisitDto,
  PaginationQueryDto,
  UpdateVisitDto,
  VisitResponseDto,
} from '../dto';

@Injectable()
export class VisitApplicationService {
  constructor(
    @Inject(VISIT_REPOSITORY)
    private readonly visitRepository: IVisitRepository,
    @Inject(PATIENT_PROFILE_REPOSITORY)
    private readonly patientProfileRepository: IPatientProfileRepository,
    @Inject(AUDIT_SERVICE)
    private readonly auditService: IAuditService,
    private readonly authorizationService: AuthorizationService,
    private readonly timelineService: TimelineApplicationService,
  ) {}

  async createVisit(
    userId: string,
    profileId: string,
    dto: CreateVisitDto,
    deviceInfo: DeviceInfo,
  ): Promise<VisitResponseDto> {
    const profile = await this.patientProfileRepository.findById(profileId);
    if (!profile || profile.deletedAt) {
      throw new AuthError(AuthErrorCode.PROFILE_NOT_FOUND, 'Profile not found');
    }

    const canManage = await this.authorizationService.canManageProfile(
      userId,
      profileId,
    );
    const canFullGrant = await this.authorizationService.canAccessProfile(
      userId,
      profileId,
      'full',
    );
    if (!canManage && !canFullGrant) {
      throw new AuthError(AuthErrorCode.UNAUTHORIZED, 'Forbidden');
    }

    const visit = new Visit({
      patientProfileId: profileId,
      familyId: profile.familyId,
      title: dto.title,
      visitedAt: dto.visitedAt ? new Date(dto.visitedAt) : new Date(),
      doctorName: dto.doctorName,
      hospitalName: dto.hospitalName,
      diagnosis: dto.diagnosis,
      notes: dto.notes,
      symptoms: dto.symptoms,
      medications: dto.medications,
      labTests: dto.labTests,
    });

    const saved = await this.visitRepository.save(visit);
    await this.timelineService.recordVisit(saved);

    await this.auditService.log({
      action: 'VISIT_CREATED',
      resourceType: 'visit',
      resourceId: saved.id,
      actorId: userId,
      patientProfileId: profileId,
      familyId: profile.familyId,
      ip: deviceInfo.ipAddress,
      userAgent: deviceInfo.userAgent,
      metadata: {
        doctorName: saved.doctorName,
        hospitalName: saved.hospitalName,
      },
    });

    return this.toResponse(saved);
  }

  async listVisits(
    userId: string,
    profileId: string,
    query: PaginationQueryDto,
  ): Promise<{ data: VisitResponseDto[]; total: number }> {
    await this.authorizationService.requireProfileAccess(
      userId,
      profileId,
      'visits_only',
    );

    const visits = (
      await this.visitRepository.findByPatientProfileId(profileId)
    ).filter((v) => !v.deletedAt);

    let filtered = visits;
    if (query.search) {
      const term = query.search.toLowerCase();
      filtered = visits.filter(
        (v) =>
          (v.doctorName?.toLowerCase().includes(term) ?? false) ||
          (v.hospitalName?.toLowerCase().includes(term) ?? false) ||
          (v.diagnosis?.toLowerCase().includes(term) ?? false) ||
          (v.title?.toLowerCase().includes(term) ?? false),
      );
    }

    const sorted = filtered.sort(
      (a, b) => b.visitedAt.getTime() - a.visitedAt.getTime(),
    );
    const total = sorted.length;
    const paginated = sorted.slice(query.offset, query.offset + query.limit);

    return { data: paginated.map((v) => this.toResponse(v)), total };
  }

  async getVisit(userId: string, visitId: string): Promise<VisitResponseDto> {
    const visit = await this.visitRepository.findById(visitId);
    if (!visit || visit.deletedAt) {
      throw new AuthError(AuthErrorCode.PROFILE_NOT_FOUND, 'Visit not found');
    }

    await this.authorizationService.requireProfileAccess(
      userId,
      visit.patientProfileId,
      'visits_only',
    );

    await this.auditService.log({
      action: 'VISIT_ACCESSED',
      resourceType: 'visit',
      resourceId: visitId,
      actorId: userId,
      patientProfileId: visit.patientProfileId,
      familyId: visit.familyId,
      metadata: { accessType: 'read' },
    });

    return this.toResponse(visit);
  }

  async updateVisit(
    userId: string,
    visitId: string,
    dto: UpdateVisitDto,
    deviceInfo: DeviceInfo,
  ): Promise<VisitResponseDto> {
    const visit = await this.visitRepository.findById(visitId);
    if (!visit || visit.deletedAt) {
      throw new AuthError(AuthErrorCode.PROFILE_NOT_FOUND, 'Visit not found');
    }

    const canManage = await this.authorizationService.canManageProfile(
      userId,
      visit.patientProfileId,
    );
    const canFullGrant = await this.authorizationService.canAccessProfile(
      userId,
      visit.patientProfileId,
      'full',
    );
    if (!canManage && !canFullGrant) {
      throw new AuthError(AuthErrorCode.UNAUTHORIZED, 'Forbidden');
    }

    visit.update({
      title: dto.title,
      visitedAt: dto.visitedAt ? new Date(dto.visitedAt) : undefined,
      doctorName: dto.doctorName,
      hospitalName: dto.hospitalName,
      diagnosis: dto.diagnosis,
      notes: dto.notes,
      symptoms: dto.symptoms,
      medications: dto.medications,
      labTests: dto.labTests,
    });

    const saved = await this.visitRepository.save(visit);
    await this.timelineService.recordVisit(saved);

    await this.auditService.log({
      action: 'VISIT_UPDATED',
      resourceType: 'visit',
      resourceId: saved.id,
      actorId: userId,
      patientProfileId: saved.patientProfileId,
      familyId: saved.familyId,
      ip: deviceInfo.ipAddress,
      userAgent: deviceInfo.userAgent,
      metadata: { fields: Object.keys(dto) },
    });

    return this.toResponse(saved);
  }

  async deleteVisit(
    userId: string,
    visitId: string,
    deviceInfo: DeviceInfo,
  ): Promise<void> {
    const visit = await this.visitRepository.findById(visitId);
    if (!visit || visit.deletedAt) {
      throw new AuthError(AuthErrorCode.PROFILE_NOT_FOUND, 'Visit not found');
    }

    const canManage = await this.authorizationService.canManageProfile(
      userId,
      visit.patientProfileId,
    );
    const canFullGrant = await this.authorizationService.canAccessProfile(
      userId,
      visit.patientProfileId,
      'full',
    );
    if (!canManage && !canFullGrant) {
      throw new AuthError(AuthErrorCode.UNAUTHORIZED, 'Forbidden');
    }

    await this.visitRepository.softDelete(visitId);

    await this.auditService.log({
      action: 'VISIT_DELETED',
      resourceType: 'visit',
      resourceId: visitId,
      actorId: userId,
      patientProfileId: visit.patientProfileId,
      familyId: visit.familyId,
      ip: deviceInfo.ipAddress,
      userAgent: deviceInfo.userAgent,
    });
  }

  async restoreVisit(
    userId: string,
    visitId: string,
    deviceInfo: DeviceInfo,
  ): Promise<VisitResponseDto> {
    const visit = await this.visitRepository.findById(visitId);
    if (!visit || !visit.deletedAt) {
      throw new AuthError(AuthErrorCode.PROFILE_NOT_FOUND, 'Visit not found');
    }

    const canManage = await this.authorizationService.canManageProfile(
      userId,
      visit.patientProfileId,
    );
    const canFullGrant = await this.authorizationService.canAccessProfile(
      userId,
      visit.patientProfileId,
      'full',
    );
    if (!canManage && !canFullGrant) {
      throw new AuthError(AuthErrorCode.UNAUTHORIZED, 'Forbidden');
    }

    if (!visit.isRestorable()) {
      throw new AuthError(
        AuthErrorCode.INVALID_INVITATION,
        'Visit can no longer be restored',
      );
    }

    visit.restore();
    const saved = await this.visitRepository.save(visit);
    await this.timelineService.recordVisit(saved);

    await this.auditService.log({
      action: 'VISIT_RESTORED',
      resourceType: 'visit',
      resourceId: saved.id,
      actorId: userId,
      patientProfileId: saved.patientProfileId,
      familyId: saved.familyId,
      ip: deviceInfo.ipAddress,
      userAgent: deviceInfo.userAgent,
    });

    return this.toResponse(saved);
  }

  private toResponse(visit: Visit): VisitResponseDto {
    return {
      id: visit.id,
      patientProfileId: visit.patientProfileId,
      familyId: visit.familyId,
      title: visit.title,
      visitedAt: visit.visitedAt,
      doctorName: visit.doctorName,
      hospitalName: visit.hospitalName,
      diagnosis: visit.diagnosis,
      notes: visit.notes,
      symptoms: visit.symptoms,
      medications: visit.medications,
      labTests: visit.labTests,
      createdAt: visit.createdAt,
      updatedAt: visit.updatedAt,
    };
  }
}
