import { FamilyMember } from './family-member.entity';

describe('FamilyMember', () => {
  it('owner outranks admin', () => {
    const owner = new FamilyMember({
      familyId: 'family-1',
      userId: 'user-1',
      role: 'owner',
    });
    expect(owner.isAtLeast('admin')).toBe(true);
    expect(owner.isAtLeast('owner')).toBe(true);
  });

  it('member does not outrank admin', () => {
    const member = new FamilyMember({
      familyId: 'family-1',
      userId: 'user-2',
      role: 'member',
    });
    expect(member.isAtLeast('admin')).toBe(false);
    expect(member.isAtLeast('member')).toBe(true);
  });

  it('updates role', () => {
    const member = new FamilyMember({
      familyId: 'family-1',
      userId: 'user-3',
      role: 'member',
    });
    member.updateRole('admin');
    expect(member.role).toBe('admin');
  });
});
