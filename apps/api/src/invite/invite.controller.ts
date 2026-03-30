import { Body, Controller, Param, Post } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Public } from '../common/decorators/public.decorator';
import { InviteService } from './invite.service';
import { SetPasswordDto } from './dto/set-password.dto';

@ApiTags('invite')
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
