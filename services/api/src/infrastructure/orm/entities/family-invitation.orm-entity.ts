import {
  Entity,
  PrimaryColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
  Index,
} from 'typeorm';

@Entity('family_invitations')
@Index(['familyId'])
@Index(['token'])
export class FamilyInvitationOrmEntity {
  @PrimaryColumn('uuid')
  id: string;

  @Column({ name: 'family_id' })
  familyId: string;

  @Column({ type: 'varchar' })
  email: string;

  @Column({ type: 'varchar' })
  role: string;

  @Column({ type: 'varchar', unique: true })
  token: string;

  @Column({ name: 'invited_by' })
  invitedBy: string;

  @Column({ type: 'varchar' })
  status: string;

  @Column({ name: 'expires_at' })
  expiresAt: Date;

  @Column({ nullable: true, name: 'accepted_at' })
  acceptedAt?: Date;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @DeleteDateColumn({ nullable: true, name: 'deleted_at' })
  deletedAt?: Date;
}
