import { Visit } from './visit.entity';

describe('Visit', () => {
  it('creates with defaults', () => {
    const visit = new Visit({ patientProfileId: 'profile-1' });
    expect(visit.patientProfileId).toBe('profile-1');
    expect(visit.visitedAt instanceof Date).toBe(true);
    expect(visit.symptoms).toEqual([]);
  });

  it('updates fields', () => {
    const visit = new Visit({
      patientProfileId: 'profile-1',
      doctorName: 'Dr. A',
    });
    visit.update({
      doctorName: 'Dr. B',
      hospitalName: 'City Hospital',
      diagnosis: 'Flu',
      symptoms: ['fever'],
    });
    expect(visit.doctorName).toBe('Dr. B');
    expect(visit.hospitalName).toBe('City Hospital');
    expect(visit.diagnosis).toBe('Flu');
    expect(visit.symptoms).toEqual(['fever']);
  });

  it('soft deletes and restores within 14 days', () => {
    const visit = new Visit({ patientProfileId: 'profile-1' });
    visit.softDelete();
    expect(visit.deletedAt).toBeDefined();
    expect(visit.isRestorable()).toBe(true);
    visit.restore();
    expect(visit.deletedAt).toBeUndefined();
  });
});
