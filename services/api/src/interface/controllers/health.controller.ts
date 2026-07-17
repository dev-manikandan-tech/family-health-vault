import {
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { HealthService } from '../../infrastructure/health/health.service';

@ApiTags('health')
@Controller('health')
export class HealthController {
  constructor(private readonly healthService: HealthService) {}

  @Get('live')
  @HttpCode(HttpStatus.OK)
  live(): Record<string, string> {
    return { status: 'ok' };
  }

  @Get('ready')
  @HttpCode(HttpStatus.OK)
  async ready(): Promise<Record<string, string>> {
    const [dbHealthy, redisHealthy] = await Promise.all([
      this.healthService.isDatabaseHealthy(),
      this.healthService.isRedisHealthy(),
    ]);

    if (!dbHealthy) {
      throw new ServiceUnavailableException('Database is not ready');
    }
    if (!redisHealthy) {
      throw new ServiceUnavailableException('Redis is not ready');
    }

    return { status: 'ready', database: 'ok', redis: 'ok' };
  }
}
