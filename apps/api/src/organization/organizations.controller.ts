import { Body, Controller, Get, Patch } from '@nestjs/common';
import { OrganizationsService } from './organizations.service';
import { UpdateOrganizationDto } from './dto/update-organization.dto';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { Role } from '@org/shared-types';

@Controller('organizations')
export class OrganizationsController {
  constructor(private readonly organizationsService: OrganizationsService) {}

  @Get('me')
  async getMe(@CurrentUser('organizationId') organizationId: string) {
    return this.organizationsService.getMe(organizationId);
  }

  @Patch('me')
  @Roles(Role.ADMIN)
  async updateMe(
    @CurrentUser('organizationId') organizationId: string,
    @Body() dto: UpdateOrganizationDto
  ) {
    return this.organizationsService.updateMe(organizationId, dto);
  }
}
