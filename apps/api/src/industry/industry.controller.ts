import { Controller, Get } from '@nestjs/common';
import { Public } from '../common/decorators/public.decorator';
import { IndustryService } from './industry.service';

@Controller('industry')
export class IndustryController {
  constructor(private readonly industryService: IndustryService) {}

  @Public()
  @Get()
  findAll() {
    return this.industryService.findAll();
  }
}
