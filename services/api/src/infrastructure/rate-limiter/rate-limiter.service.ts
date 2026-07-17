import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  RateLimiterMemory,
  RateLimiterRedis,
  RateLimiterAbstract,
} from 'rate-limiter-flexible';
import Redis from 'ioredis';

@Injectable()
export class RateLimiterService {
  private readonly limiter: RateLimiterAbstract;

  constructor(private readonly configService: ConfigService) {
    const redisUrl = this.configService.get<string>('REDIS_URL');
    const points = parseInt(
      this.configService.get<string>('RATE_LIMIT_POINTS') || '100',
      10,
    );
    const duration = parseInt(
      this.configService.get<string>('RATE_LIMIT_DURATION') || '60',
      10,
    );

    if (redisUrl) {
      this.limiter = new RateLimiterRedis({
        storeClient: new Redis(redisUrl),
        keyPrefix: 'auth_rl',
        points,
        duration,
      });
    } else {
      this.limiter = new RateLimiterMemory({
        keyPrefix: 'auth_rl',
        points,
        duration,
      });
    }
  }

  async consume(
    key: string,
    points = 1,
  ): Promise<{ remainingPoints: number; msBeforeNext: number }> {
    const result = await this.limiter.consume(key, points);
    return {
      remainingPoints: result.remainingPoints,
      msBeforeNext: result.msBeforeNext,
    };
  }
}
