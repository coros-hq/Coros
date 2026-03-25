import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EmployeeInviteToken } from './entities/employee-invite-token.entity';
import { User } from '../user/entities/user.entity';
import { InviteService } from './invite.service';
import { InviteController } from './invite.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([EmployeeInviteToken, User]),
  ],
  controllers: [InviteController],
  providers: [InviteService],
  exports: [InviteService],
})
export class InviteModule {}
