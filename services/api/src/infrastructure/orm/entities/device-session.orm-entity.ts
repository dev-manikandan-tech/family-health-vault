import { Entity, PrimaryColumn, Column, CreateDateColumn } from 'typeorm';

@Entity('device_sessions')
export class DeviceSessionOrmEntity {
  @PrimaryColumn('uuid')
  id: string;

  @Column('uuid', { name: 'user_id' })
  userId: string;

  @Column('uuid', { name: 'refresh_token_id' })
  refreshTokenId: string;

  @Column({ nullable: true, name: 'device_id' })
  deviceId?: string;

  @Column({ nullable: true, name: 'device_name' })
  deviceName?: string;

  @Column({ nullable: true, name: 'ip_address' })
  ipAddress?: string;

  @Column({ nullable: true, name: 'user_agent' })
  userAgent?: string;

  @Column({ name: 'last_active_at' })
  lastActiveAt: Date;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
