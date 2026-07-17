import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';
import { ITokenStore } from '../../../domain/services/token-store.interface';

@Injectable()
export class RedisTokenStore implements ITokenStore {
  private redis?: Redis;

  constructor(private readonly configService: ConfigService) {}

  async set(key: string, value: string, ttlSeconds: number): Promise<void> {
    await this.getRedis().setex(key, ttlSeconds, value);
  }

  async get(key: string): Promise<string | null> {
    return this.getRedis().get(key);
  }

  async delete(key: string): Promise<void> {
    await this.getRedis().del(key);
  }

  private getRedis(): Redis {
    if (!this.redis) {
      const url = this.configService.get<string>('REDIS_URL');
      this.redis = url ? new Redis(url) : new Redis();
    }
    return this.redis;
  }
}
