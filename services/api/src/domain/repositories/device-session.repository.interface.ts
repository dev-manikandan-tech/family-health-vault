import { DeviceSession } from '../entities/device-session.entity';

export interface IDeviceSessionRepository {
  findById(id: string): Promise<DeviceSession | null>;
  save(session: DeviceSession): Promise<DeviceSession>;
}
