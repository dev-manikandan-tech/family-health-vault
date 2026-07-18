import {
  Entity,
  PrimaryColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
  Index,
} from 'typeorm';

@Entity('family_members')
@Index(['familyId'])
@Index(['userId'])
export class FamilyMemberOrmEntity {
  @PrimaryColumn('uuid')
  id: string;

  @Column({ name: 'family_id' })
  familyId: string;

  @Column({ name: 'user_id', nullable: true })
  userId?: string;

  @Column({ nullable: true, type: 'varchar' })
  email?: string;

  @Column({ nullable: true, type: 'varchar' })
  name?: string;

  @Column({ type: 'varchar' })
  role: string;

  @Column({ nullable: true, name: 'joined_at' })
  joinedAt?: Date;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @DeleteDateColumn({ nullable: true, name: 'deleted_at' })
  deletedAt?: Date;
}
