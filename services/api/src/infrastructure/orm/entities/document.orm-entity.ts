import {
  Entity,
  PrimaryColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
  Index,
} from 'typeorm';

@Entity('documents')
@Index(['patientProfileId'])
@Index(['visitId'])
export class DocumentOrmEntity {
  @PrimaryColumn('uuid')
  id: string;

  @Column({ name: 'patient_profile_id' })
  patientProfileId: string;

  @Column({ name: 'visit_id', nullable: true })
  visitId?: string;

  @Column({ name: 'uploaded_by' })
  uploadedBy: string;

  @Column({ name: 'family_id', nullable: true })
  familyId?: string;

  @Column({ nullable: true, name: 'original_name', type: 'varchar' })
  originalName?: string;

  @Column({ nullable: true, type: 'varchar' })
  contentType?: string;

  @Column({ nullable: true, type: 'bigint' })
  size?: number;

  @Column({ nullable: true, type: 'varchar' })
  checksum?: string;

  @Column({ type: 'varchar', default: 'pending_upload' })
  status: string;

  @Column({ nullable: true, name: 'storage_provider', type: 'varchar' })
  storageProvider?: string;

  @Column({ nullable: true, name: 'original_key', type: 'varchar' })
  originalKey?: string;

  @Column({ nullable: true, name: 'converted_key', type: 'varchar' })
  convertedKey?: string;

  @Column({ nullable: true, name: 'thumbnail_key', type: 'varchar' })
  thumbnailKey?: string;

  @Column({ nullable: true, name: 'processing_error', type: 'text' })
  processingError?: string;

  @Column({ default: 0, name: 'retry_count' })
  retryCount: number;

  @Column({ type: 'simple-json', nullable: true, name: 'extracted_metadata' })
  extractedMetadata: Record<string, unknown>;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @DeleteDateColumn({ nullable: true, name: 'deleted_at' })
  deletedAt?: Date;
}
