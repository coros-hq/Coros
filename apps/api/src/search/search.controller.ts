import { BadRequestException, Controller, Get, Query } from '@nestjs/common';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { SearchService } from './search.service';

@Controller('search')
export class SearchController {
  constructor(private readonly searchService: SearchService) {}

  @Get()
  async search(
    @CurrentUser('organizationId') organizationId: string,
    @Query('q') q: string | undefined,
  ) {
    if (!q || typeof q !== 'string') {
      throw new BadRequestException('Query parameter "q" is required');
    }
    const trimmed = q.trim();
    if (trimmed.length < 2) {
      throw new BadRequestException('Query must be at least 2 characters');
    }
    return this.searchService.search(organizationId, trimmed);
  }
}
