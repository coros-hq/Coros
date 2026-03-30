import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { MeService } from './me.service';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { SetupAccountDto } from './dto/setup-account.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';

@ApiTags('me')
@ApiBearerAuth('JWT')
@Controller('me')
export class MeController {
  constructor(private readonly meService: MeService) {}

  @Get('employee')
  @UseGuards(JwtAuthGuard)
  getEmployee(
    @CurrentUser('id') userId: string,
    @CurrentUser('organizationId') organizationId: string,
  ) {
    return this.meService.getEmployee(userId, organizationId);
  }

  @Get('tasks')
  @UseGuards(JwtAuthGuard)
  getMyTasks(
    @CurrentUser('id') userId: string,
    @CurrentUser('organizationId') organizationId: string,
  ) {
    return this.meService.getMyTasks(userId, organizationId);
  }

  @Get('setup-status')
  getSetupStatus(
    @CurrentUser('id') userId: string,
    @CurrentUser('organizationId') organizationId: string,
  ) {
    return this.meService.getSetupStatus(userId, organizationId);
  }

  @Post('setup')
  setup(
    @CurrentUser('id') userId: string,
    @CurrentUser('organizationId') organizationId: string,
    @Body() dto: SetupAccountDto,
  ) {
    return this.meService.setup(userId, organizationId, dto);
  }
}
