import { randomUUID } from 'crypto';

export interface DeviceSessionProps {
  id?: string;
  userId: string;
  refreshTokenId: string;
  deviceId?: string;
  deviceName?: string;
  ipAddress?: string;
  userAgent?: string;
  lastActiveAt?: Date;
  createdAt?: Date;
}

export class DeviceSession {
  id: string;
  userId: string;
  refreshTokenId: string;
  deviceId?: string;
  deviceName?: string;
  ipAddress?: string;
  userAgent?: string;
  lastActiveAt: Date;
  createdAt: Date;

  constructor(props: DeviceSessionProps) {
    this.id = props.id ?? randomUUID();
    this.userId = props.userId;
    this.refreshTokenId = props.refreshTokenId;
    this.deviceId = props.deviceId;
    this.deviceName = props.deviceName;
    this.ipAddress = props.ipAddress;
    this.userAgent = props.userAgent;
    this.lastActiveAt = props.lastActiveAt ?? new Date();
    this.createdAt = props.createdAt ?? new Date();
  }

  touch(): void {
    this.lastActiveAt = new Date();
  }
}
