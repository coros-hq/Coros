import {
  Body,
  Controller,
  ForbiddenException,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiBearerAuth,
  ApiConsumes,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { OrganizationsService } from './organizations.service';
import { UpdateOrganizationDto } from './dto/update-organization.dto';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Public } from '../common/decorators/public.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { Role } from '@org/shared-types';

@ApiTags('organizations')
@Controller('organizations')
export class OrganizationsController {
  constructor(private readonly organizationsService: OrganizationsService) {}

  @ApiBearerAuth('JWT')
  @Get('me')
  async getMe(@CurrentUser('organizationId') organizationId: string) {
    return this.organizationsService.getMe(organizationId);
  }

  @ApiBearerAuth('JWT')
  @Patch('me')
  @Roles(Role.SUPER_ADMIN, Role.ADMIN)
  async updateMe(
    @CurrentUser('organizationId') organizationId: string,
    @Body() dto: UpdateOrganizationDto
  ) {
    return this.organizationsService.updateMe(organizationId, dto);
  }

  @Public()
  @Get(':id/branding')
  @ApiOperation({ summary: 'Public organization branding (logo + color)' })
  async getBranding(@Param('id', ParseUUIDPipe) id: string) {
    return this.organizationsService.getBranding(id);
  }

  @ApiBearerAuth('JWT')
  @Patch(':id/branding')
  @Roles(Role.SUPER_ADMIN, Role.ADMIN)
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Update organization branding (admin only)' })
  @UseInterceptors(FileInterceptor('logo'))
  async updateBranding(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser('organizationId') organizationId: string,
    @UploadedFile() logo: Express.Multer.File | undefined,
    @Body('brandColor') brandColor?: string,
  ) {
    if (id !== organizationId) {
      throw new ForbiddenException('Cannot modify another organization');
    }
    return this.organizationsService.updateBranding(organizationId, logo, brandColor);
  }
}
