import { RecordAccessGrant } from './record-access-grant.entity';

describe('RecordAccessGrant', () => {
  it('full grant covers all scopes', () => {
    const grant = new RecordAccessGrant({
      patientProfileId: 'profile-1',
      granteeUserId: 'user-1',
      scope: 'full',
      grantedBy: 'user-2',
    });
    expect(grant.isAtLeast('full')).toBe(true);
    expect(grant.isAtLeast('visits_only')).toBe(true);
    expect(grant.isAtLeast('emergency_card')).toBe(true);
  });

  it('visits_only grant does not cover full', () => {
    const grant = new RecordAccessGrant({
      patientProfileId: 'profile-1',
      granteeUserId: 'user-1',
      scope: 'visits_only',
      grantedBy: 'user-2',
    });
    expect(grant.isAtLeast('full')).toBe(false);
    expect(grant.isAtLeast('emergency_card')).toBe(true);
  });

  it('detects expiry', () => {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const grant = new RecordAccessGrant({
      patientProfileId: 'profile-1',
      granteeUserId: 'user-1',
      scope: 'full',
      grantedBy: 'user-2',
      expiresAt: yesterday,
    });
    expect(grant.isExpired()).toBe(true);
  });
});
