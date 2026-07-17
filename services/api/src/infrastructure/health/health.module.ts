import { Module } from '@nestjs/common';
import { HealthService } from './health.service';
import { HealthController } from '../../interface/controllers/health.controller';

@Module({
  providers: [HealthService],
  controllers: [HealthController],
})
export class HealthModule {}
