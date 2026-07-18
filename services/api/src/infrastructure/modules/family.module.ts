import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from './auth.module';
import { DatabaseModule } from '../database/database.module';
import { FamilyOrmEntity } from '../orm/entities/family.orm-entity';
import { FamilyMemberOrmEntity } from '../orm/entities/family-member.orm-entity';
import { FamilyInvitationOrmEntity } from '../orm/entities/family-invitation.orm-entity';
import { PatientProfileOrmEntity } from '../orm/entities/patient-profile.orm-entity';
import { RecordAccessGrantOrmEntity } from '../orm/entities/record-access-grant.orm-entity';
import { TypeOrmFamilyRepository } from '../orm/repositories/family.typeorm.repository';
import { TypeOrmFamilyMemberRepository } from '../orm/repositories/family-member.typeorm.repository';
import { TypeOrmFamilyInvitationRepository } from '../orm/repositories/family-invitation.typeorm.repository';
import { TypeOrmPatientProfileRepository } from '../orm/repositories/patient-profile.typeorm.repository';
import { TypeOrmRecordAccessGrantRepository } from '../orm/repositories/record-access-grant.typeorm.repository';
import { FamilyApplicationService } from '../../application/services/family-application.service';
import { PatientProfileApplicationService } from '../../application/services/patient-profile-application.service';
import { RecordAccessGrantApplicationService } from '../../application/services/record-access-grant-application.service';
import { AuthorizationService } from '../../application/services/authorization.service';
import { FamilyController } from '../../interface/controllers/family.controller';
import { PatientProfileController } from '../../interface/controllers/patient-profile.controller';
import { RecordAccessGrantController } from '../../interface/controllers/record-access-grant.controller';
import {
  FAMILY_REPOSITORY,
  FAMILY_MEMBER_REPOSITORY,
  FAMILY_INVITATION_REPOSITORY,
  PATIENT_PROFILE_REPOSITORY,
  RECORD_ACCESS_GRANT_REPOSITORY,
} from '../../domain/constants/injection-tokens';

@Module({
  imports: [
    AuthModule,
    DatabaseModule,
    TypeOrmModule.forFeature([
      FamilyOrmEntity,
      FamilyMemberOrmEntity,
      FamilyInvitationOrmEntity,
      PatientProfileOrmEntity,
      RecordAccessGrantOrmEntity,
    ]),
  ],
  controllers: [
    FamilyController,
    PatientProfileController,
    RecordAccessGrantController,
  ],
  providers: [
    FamilyApplicationService,
    PatientProfileApplicationService,
    RecordAccessGrantApplicationService,
    AuthorizationService,
    { provide: FAMILY_REPOSITORY, useClass: TypeOrmFamilyRepository },
    {
      provide: FAMILY_MEMBER_REPOSITORY,
      useClass: TypeOrmFamilyMemberRepository,
    },
    {
      provide: FAMILY_INVITATION_REPOSITORY,
      useClass: TypeOrmFamilyInvitationRepository,
    },
    {
      provide: PATIENT_PROFILE_REPOSITORY,
      useClass: TypeOrmPatientProfileRepository,
    },
    {
      provide: RECORD_ACCESS_GRANT_REPOSITORY,
      useClass: TypeOrmRecordAccessGrantRepository,
    },
  ],
  exports: [
    FamilyApplicationService,
    PatientProfileApplicationService,
    RecordAccessGrantApplicationService,
    AuthorizationService,
    FAMILY_REPOSITORY,
    FAMILY_MEMBER_REPOSITORY,
    FAMILY_INVITATION_REPOSITORY,
    PATIENT_PROFILE_REPOSITORY,
    RECORD_ACCESS_GRANT_REPOSITORY,
  ],
})
export class FamilyModule {}
