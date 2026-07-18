import { randomUUID } from 'crypto';

export interface PatientProfileProps {
  id?: string;
  userId?: string;
  familyId?: string;
  name: string;
  dob?: Date;
  sex?: string;
  bloodGroup?: string;
  allergies?: string[];
  abhaId?: string;
  managedByUserId?: string;
  createdAt?: Date;
  updatedAt?: Date;
  deletedAt?: Date;
}

export class PatientProfile {
  id: string;
  userId?: string;
  familyId?: string;
  name: string;
  dob?: Date;
  sex?: string;
  bloodGroup?: string;
  allergies: string[];
  abhaId?: string;
  managedByUserId?: string;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date;

  constructor(props: PatientProfileProps) {
    this.id = props.id ?? randomUUID();
    this.userId = props.userId;
    this.familyId = props.familyId;
    this.name = props.name.trim();
    this.dob = props.dob;
    this.sex = props.sex;
    this.bloodGroup = props.bloodGroup;
    this.allergies = props.allergies ?? [];
    this.abhaId = props.abhaId;
    this.managedByUserId = props.managedByUserId;
    this.createdAt = props.createdAt ?? new Date();
    this.updatedAt = props.updatedAt ?? new Date();
    this.deletedAt = props.deletedAt;
  }

  update(updates: Partial<PatientProfileProps>): void {
    if (updates.name) this.name = updates.name.trim();
    if (updates.dob !== undefined) this.dob = updates.dob;
    if (updates.sex !== undefined) this.sex = updates.sex;
    if (updates.bloodGroup !== undefined) this.bloodGroup = updates.bloodGroup;
    if (updates.allergies !== undefined) this.allergies = updates.allergies;
    if (updates.abhaId !== undefined) this.abhaId = updates.abhaId;
    if (updates.managedByUserId !== undefined)
      this.managedByUserId = updates.managedByUserId;
    this.updatedAt = new Date();
  }

  softDelete(): void {
    this.deletedAt = new Date();
    this.updatedAt = new Date();
  }

  transferUser(userId: string): void {
    this.userId = userId;
    this.managedByUserId = undefined;
    this.updatedAt = new Date();
  }
}
