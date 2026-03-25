import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { randomBytes } from 'crypto';
import { hash } from 'bcryptjs';
import { EmployeeInviteToken } from './entities/employee-invite-token.entity';
import { User } from '../user/entities/user.entity';

@Injectable()
export class InviteService {
  constructor(
    @InjectRepository(EmployeeInviteToken)
    private readonly inviteTokenRepository: Repository<EmployeeInviteToken>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  async createToken(userId: string): Promise<{ token: string; expiresAt: Date }> {
    const token = randomBytes(32).toString('hex');
    const expiresAt = EmployeeInviteToken.expiresInHours();
    const invite = this.inviteTokenRepository.create({
      userId,
      token,
      expiresAt,
    });
    await this.inviteTokenRepository.save(invite);
    return { token, expiresAt };
  }

  async setPassword(token: string, password: string): Promise<void> {
    const invite = await this.inviteTokenRepository.findOne({
      where: { token },
      relations: ['user'],
    });
    if (!invite) {
      throw new NotFoundException('Invalid or expired invite link');
    }
    if (invite.used) {
      throw new BadRequestException('This invite link has already been used');
    }
    if (new Date() > invite.expiresAt) {
      throw new BadRequestException('This invite link has expired');
    }
    const hashedPassword = await hash(password, 10);
    await this.userRepository.update(invite.userId, {
      password: hashedPassword,
    });
    invite.used = true;
    await this.inviteTokenRepository.save(invite);
  }
}
