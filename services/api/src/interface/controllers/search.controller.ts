import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../infrastructure/security/current-user.decorator';
import { SupabaseAuthGuard } from '../../infrastructure/security/supabase-auth.guard';
import { SearchApplicationService } from '../../application/services/search-application.service';

@ApiTags('Search')
@ApiBearerAuth()
@UseGuards(SupabaseAuthGuard)
@Controller('search')
export class SearchController {
  constructor(private readonly searchService: SearchApplicationService) {}

  @Get()
  search(
    @CurrentUser('userId') userId: string,
    @Query('q') query: string,
    @Query('profileId') profileId?: string,
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
  ) {
    return this.searchService.search(userId, query ?? '', {
      profileId,
      limit: limit ? parseInt(limit, 10) : undefined,
      offset: offset ? parseInt(offset, 10) : undefined,
    });
  }

  @Get('autocomplete')
  autocomplete(
    @CurrentUser('userId') userId: string,
    @Query('q') query: string,
    @Query('profileId') profileId?: string,
    @Query('limit') limit?: string,
  ) {
    return this.searchService.autocomplete(userId, query ?? '', {
      profileId,
      limit: limit ? parseInt(limit, 10) : undefined,
    });
  }
}
