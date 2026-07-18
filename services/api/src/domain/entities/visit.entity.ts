import { randomUUID } from 'crypto';

export interface VisitProps {
  id?: string;
  patientProfileId: string;
  familyId?: string;
  title?: string;
  visitedAt?: Date;
  doctorName?: string;
  hospitalName?: string;
  diagnosis?: string;
  notes?: string;
  symptoms?: string[];
  medications?: string[];
  labTests?: string[];
  createdAt?: Date;
  updatedAt?: Date;
  deletedAt?: Date;
}

export class Visit {
  id: string;
  patientProfileId: string;
  familyId?: string;
  title?: string;
  visitedAt: Date;
  doctorName?: string;
  hospitalName?: string;
  diagnosis?: string;
  notes?: string;
  symptoms: string[];
  medications: string[];
  labTests: string[];
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date;

  constructor(props: VisitProps) {
    this.id = props.id ?? randomUUID();
    this.patientProfileId = props.patientProfileId;
    this.familyId = props.familyId;
    this.title = props.title?.trim();
    this.visitedAt = props.visitedAt ?? new Date();
    this.doctorName = props.doctorName?.trim();
    this.hospitalName = props.hospitalName?.trim();
    this.diagnosis = props.diagnosis?.trim();
    this.notes = props.notes?.trim();
    this.symptoms = props.symptoms ?? [];
    this.medications = props.medications ?? [];
    this.labTests = props.labTests ?? [];
    this.createdAt = props.createdAt ?? new Date();
    this.updatedAt = props.updatedAt ?? new Date();
    this.deletedAt = props.deletedAt;
  }

  update(updates: Partial<VisitProps>): void {
    if (updates.title !== undefined) this.title = updates.title?.trim();
    if (updates.visitedAt !== undefined) this.visitedAt = updates.visitedAt;
    if (updates.doctorName !== undefined)
      this.doctorName = updates.doctorName?.trim();
    if (updates.hospitalName !== undefined)
      this.hospitalName = updates.hospitalName?.trim();
    if (updates.diagnosis !== undefined)
      this.diagnosis = updates.diagnosis?.trim();
    if (updates.notes !== undefined) this.notes = updates.notes?.trim();
    if (updates.symptoms !== undefined) this.symptoms = updates.symptoms;
    if (updates.medications !== undefined)
      this.medications = updates.medications;
    if (updates.labTests !== undefined) this.labTests = updates.labTests;
    this.updatedAt = new Date();
  }

  softDelete(): void {
    this.deletedAt = new Date();
    this.updatedAt = new Date();
  }

  restore(): void {
    this.deletedAt = undefined;
    this.updatedAt = new Date();
  }

  isRestorable(): boolean {
    if (!this.deletedAt) return false;
    const cutoff = new Date(
      this.deletedAt.getTime() + 14 * 24 * 60 * 60 * 1000,
    );
    return new Date() <= cutoff;
  }
}
