import { randomUUID } from 'crypto';

export type FamilyRole = 'owner' | 'admin' | 'member' | 'dependent';

export interface FamilyMemberProps {
  id?: string;
  familyId: string;
  userId?: string;
  email?: string;
  name?: string;
  role: FamilyRole;
  joinedAt?: Date;
  createdAt?: Date;
  updatedAt?: Date;
  deletedAt?: Date;
}

export class FamilyMember {
  id: string;
  familyId: string;
  userId?: string;
  email?: string;
  name?: string;
  role: FamilyRole;
  joinedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date;

  constructor(props: FamilyMemberProps) {
    this.id = props.id ?? randomUUID();
    this.familyId = props.familyId;
    this.userId = props.userId;
    this.email = props.email?.toLowerCase().trim();
    this.name = props.name?.trim();
    this.role = props.role;
    this.joinedAt = props.joinedAt;
    this.createdAt = props.createdAt ?? new Date();
    this.updatedAt = props.updatedAt ?? new Date();
    this.deletedAt = props.deletedAt;
  }

  updateRole(role: FamilyRole): void {
    this.role = role;
    this.updatedAt = new Date();
  }

  markJoined(): void {
    this.joinedAt = new Date();
    this.updatedAt = new Date();
  }

  softDelete(): void {
    this.deletedAt = new Date();
    this.updatedAt = new Date();
  }

  isAtLeast(role: FamilyRole): boolean {
    const hierarchy: Record<FamilyRole, number> = {
      owner: 4,
      admin: 3,
      member: 2,
      dependent: 1,
    };
    return hierarchy[this.role] >= hierarchy[role];
  }
}
