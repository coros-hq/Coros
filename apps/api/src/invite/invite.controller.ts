import { Body, Controller, Param, Post, UseGuards } from '@nestjs/common';
import { Public } from '../common/decorators/public.decorator';
import { InviteService } from './invite.service';
import { SetPasswordDto } from './dto/set-password.dto';

@Controller('invite')
export class InviteController {
  constructor(private readonly inviteService: InviteService) {}

  @Post('set-password/:token')
  @Public()
  async setPassword(
    @Param('token') token: string,
    @Body() dto: SetPasswordDto,
  ): Promise<{ message: string }> {
    await this.inviteService.setPassword(token, dto.password);
    return { message: 'Password set successfully. You can now sign in.' };
  }
}
