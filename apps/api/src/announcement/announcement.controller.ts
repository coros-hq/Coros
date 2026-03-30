import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Role } from '@org/shared-types';
import { AnnouncementService } from './announcement.service';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { CreateAnnouncementDto } from './dto/create-announcement.dto';
import { UpdateAnnouncementDto } from './dto/update-announcement.dto';

@ApiTags('announcements')
@ApiBearerAuth('JWT')
@Controller('announcements')
export class AnnouncementController {
  constructor(private readonly announcementService: AnnouncementService) {}

  /**
   * Default: unread active announcements (dashboard banners).
   * `?view=feed`: all active announcements with read state (employee announcements page).
   */
  @Get()
  @Roles(Role.SUPER_ADMIN, Role.ADMIN, Role.MANAGER, Role.EMPLOYEE)
  findAllOrFeed(
    @Query('view') view: string | undefined,
    @CurrentUser('id') userId: string,
    @CurrentUser('organizationId') organizationId: string,
    @CurrentUser('role') _role: Role,
  ) {
    if (view === 'feed') {
      return this.announcementService.findFeed(userId, organizationId);
    }
    return this.announcementService.findAll(userId, organizationId);
  }

  @Get('all')
  @Roles(Role.SUPER_ADMIN, Role.ADMIN)
  findAllForAdmin(
    @CurrentUser('organizationId') organizationId: string,
    @CurrentUser('role') _role: Role,
  ) {
    return this.announcementService.findAllForAdmin(organizationId);
  }

  @Post()
  @Roles(Role.SUPER_ADMIN, Role.ADMIN)
  create(
    @CurrentUser('organizationId') organizationId: string,
    @CurrentUser('id') authorId: string,
    @CurrentUser('role') _role: Role,
    @Body() dto: CreateAnnouncementDto,
  ) {
    return this.announcementService.create(organizationId, authorId, dto);
  }

  @Post(':id/read')
  @Roles(Role.SUPER_ADMIN, Role.ADMIN, Role.MANAGER, Role.EMPLOYEE)
  markAsRead(
    @Param('id') id: string,
    @CurrentUser('id') userId: string,
    @CurrentUser('organizationId') organizationId: string,
    @CurrentUser('role') _role: Role,
  ) {
    return this.announcementService.markAsRead(id, userId, organizationId);
  }

  @Patch(':id')
  @Roles(Role.SUPER_ADMIN, Role.ADMIN)
  update(
    @CurrentUser('organizationId') organizationId: string,
    @CurrentUser('role') _role: Role,
    @Param('id') id: string,
    @Body() dto: UpdateAnnouncementDto,
  ) {
    return this.announcementService.update(organizationId, id, dto);
  }

  @Delete(':id')
  @Roles(Role.SUPER_ADMIN, Role.ADMIN)
  remove(
    @CurrentUser('organizationId') organizationId: string,
    @CurrentUser('role') _role: Role,
    @Param('id') id: string,
  ) {
    return this.announcementService.remove(organizationId, id);
  }
}
