import { RecordAccessGrant } from '../entities/record-access-grant.entity';

export interface IRecordAccessGrantRepository {
  findById(id: string): Promise<RecordAccessGrant | null>;
  findByPatientProfileId(
    patientProfileId: string,
  ): Promise<RecordAccessGrant[]>;
  findByGranteeUserIdAndProfileId(
    granteeUserId: string,
    patientProfileId: string,
  ): Promise<RecordAccessGrant | null>;
  findActiveByGranteeAndProfile(
    granteeUserId: string,
    patientProfileId: string,
  ): Promise<RecordAccessGrant | null>;
  findActiveByGranteeUserId(
    granteeUserId: string,
  ): Promise<RecordAccessGrant[]>;
  save(grant: RecordAccessGrant): Promise<RecordAccessGrant>;
  revoke(id: string): Promise<void>;
}
