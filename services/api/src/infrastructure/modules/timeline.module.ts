import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from './auth.module';
import { FamilyModule } from './family.module';
import { DatabaseModule } from '../database/database.module';
import { TimelineEventOrmEntity } from '../orm/entities/timeline-event.orm-entity';
import { TypeOrmTimelineEventRepository } from '../orm/repositories/timeline-event.typeorm.repository';
import { TimelineApplicationService } from '../../application/services/timeline-application.service';
import { TimelineController } from '../../interface/controllers/timeline.controller';
import { PdfLibGenerator } from '../pdf/pdf-lib.generator';
import {
  TIMELINE_EVENT_REPOSITORY,
  PDF_GENERATOR,
} from '../../domain/constants/injection-tokens';

@Module({
  imports: [
    AuthModule,
    FamilyModule,
    DatabaseModule,
    TypeOrmModule.forFeature([TimelineEventOrmEntity]),
  ],
  controllers: [TimelineController],
  providers: [
    TimelineApplicationService,
    {
      provide: TIMELINE_EVENT_REPOSITORY,
      useClass: TypeOrmTimelineEventRepository,
    },
    { provide: PDF_GENERATOR, useClass: PdfLibGenerator },
  ],
  exports: [TimelineApplicationService],
})
export class TimelineModule {}
