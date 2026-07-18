import { Module } from '@nestjs/common';
import { AuthModule } from './auth.module';
import { FamilyModule } from './family.module';
import { DatabaseModule } from '../database/database.module';
import { SearchApplicationService } from '../../application/services/search-application.service';
import { SearchController } from '../../interface/controllers/search.controller';

@Module({
  imports: [AuthModule, FamilyModule, DatabaseModule],
  controllers: [SearchController],
  providers: [SearchApplicationService],
})
export class SearchModule {}
