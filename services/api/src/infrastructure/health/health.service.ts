import { Injectable } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import Redis from 'ioredis';

@Injectable()
export class HealthService {
  constructor(
    @InjectDataSource()
    private readonly dataSource: DataSource,
  ) {}

  async isDatabaseHealthy(): Promise<boolean> {
    try {
      await this.dataSource.query('SELECT 1');
      return true;
    } catch {
      return false;
    }
  }

  async isRedisHealthy(): Promise<boolean> {
    const redisUrl = process.env.REDIS_URL ?? 'redis://localhost:6379';
    const redis = new Redis(redisUrl, { lazyConnect: true });
    try {
      await redis.connect();
      await redis.ping();
      return true;
    } catch {
      return false;
    } finally {
      redis.disconnect();
    }
  }
}
