import { DeviceSession } from '../entities/device-session.entity';

export interface IDeviceSessionRepository {
  findById(id: string): Promise<DeviceSession | null>;
  findByUserId(userId: string): Promise<DeviceSession[]>;
  findByUserAndDeviceId(
    userId: string,
    deviceId?: string,
  ): Promise<DeviceSession | null>;
  save(session: DeviceSession): Promise<DeviceSession>;
  delete(id: string): Promise<void>;
  deleteByUserId(userId: string): Promise<void>;
}
