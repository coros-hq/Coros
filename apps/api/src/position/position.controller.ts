import { Body, Controller, Delete, Get, Param, Post, Put, UseGuards } from '@nestjs/common';
import { PositionService } from './position.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { Role } from '@org/shared-types';
import { NewPositionDto } from './dto/position.dto';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@Controller('positions')
export class PositionController {
  constructor(private readonly positionService: PositionService) {}

  @Post('create/:departmentId')
  @UseGuards(JwtAuthGuard)
  @Roles(Role.SUPER_ADMIN, Role.ADMIN)
  async createPosition(
    @Param('departmentId') departmentId: string,
    @Body() position: NewPositionDto
  ) {
    return await this.positionService.createPosition(departmentId, position);
  }

  @Put('update/:id')
  @UseGuards(JwtAuthGuard)
  @Roles(Role.SUPER_ADMIN, Role.ADMIN)
  async updatePosition(
    @Param('id') id: string,
    @Body() position: NewPositionDto
  ) {
    return await this.positionService.updatePosition(id, position);
  }

  @Delete('delete/:id')
  @UseGuards(JwtAuthGuard)
  @Roles(Role.SUPER_ADMIN, Role.ADMIN)
  async deletePosition(@Param('id') id: string) {
    return await this.positionService.deletePosition(id);
  }

  @Get('all')
  @UseGuards(JwtAuthGuard)
  @Roles(Role.SUPER_ADMIN, Role.ADMIN, Role.MANAGER)
  async getOrganizationPositions(
    @CurrentUser('organizationId') organizationId: string
  ) {
    return await this.positionService.getOrganizationPositions(organizationId);
  }

  @Get(':departmentId')
  @UseGuards(JwtAuthGuard)
  @Roles(Role.SUPER_ADMIN, Role.ADMIN)
  async getDepartmentPositions(@Param('departmentId') departmentId: string) {
    return await this.positionService.getDepartmentPositions(departmentId);
  }
}
