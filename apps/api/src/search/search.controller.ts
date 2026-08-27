import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { SearchService } from './search.service';
import { SearchQueryDto } from './dto/search-query.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentTenant } from '../common/decorators/current-tenant.decorator';

@ApiTags('Search')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('search')
export class SearchController {
  constructor(private readonly searchService: SearchService) {}

  @Get()
  @ApiOperation({
    summary: 'Fast global search across customers, pets, phone numbers, and microchips',
  })
  @ApiResponse({ status: 200, description: 'Search results returned' })
  search(
    @CurrentTenant() tenantId: string,
    @Query() query: SearchQueryDto
  ) {
    return this.searchService.search(tenantId, query);
  }
}
