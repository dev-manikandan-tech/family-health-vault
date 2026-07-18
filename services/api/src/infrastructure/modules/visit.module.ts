import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FamilyModule } from './family.module';
import { AuthModule } from './auth.module';
import { DatabaseModule } from '../database/database.module';
import { VisitOrmEntity } from '../orm/entities/visit.orm-entity';
import {
  VisitController,
  VisitDetailController,
} from '../../interface/controllers/visit.controller';
import { VisitApplicationService } from '../../application/services/visit-application.service';
import { TypeOrmVisitRepository } from '../orm/repositories/visit.typeorm.repository';
import { VISIT_REPOSITORY } from '../../domain/constants/injection-tokens';

@Module({
  imports: [
    AuthModule,
    FamilyModule,
    DatabaseModule,
    TypeOrmModule.forFeature([VisitOrmEntity]),
  ],
  controllers: [VisitController, VisitDetailController],
  providers: [
    VisitApplicationService,
    { provide: VISIT_REPOSITORY, useClass: TypeOrmVisitRepository },
  ],
  exports: [VisitApplicationService, VISIT_REPOSITORY],
})
export class VisitModule {}
