import {
  BadRequestException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';
import { DataSource, Not, Repository } from 'typeorm';
import { compare, hash } from 'bcryptjs';
import { User } from './entities/user.entity';
import { UpdateUserDto } from './dto/update-user.dto';

type SafeUser = Omit<User, 'password' | 'refreshToken'>;

@Injectable()
export class UsersService {
  constructor(
    @InjectDataSource()
    private readonly dataSource: DataSource,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>
  ) {}

  async getMe(id: string): Promise<SafeUser> {
    const user = await this.userRepository.findOne({ where: { id } });
    if (!user) {
      throw new NotFoundException('User not found');
    }
    const { password, refreshToken, ...safeUser } = user;
    return safeUser;
  }

  async updateMe(id: string, dto: UpdateUserDto): Promise<SafeUser> {
    return await this.dataSource.transaction(async (manager) => {
      const userRepo = manager.getRepository(User);

      const user = await userRepo.findOne({ where: { id } });
      if (!user) {
        throw new NotFoundException('User not found');
      }

      if (dto.email !== undefined) {
        const existing = await userRepo.findOne({
          where: { email: dto.email, id: Not(id) },
        });
        if (existing) {
          throw new BadRequestException('Email is already in use');
        }
        user.email = dto.email;
      }

      if (dto.newPassword !== undefined) {
        const isMatch = await compare(
          dto.currentPassword as string,
          user.password
        );
        if (!isMatch) {
          throw new UnauthorizedException('Current password is incorrect');
        }
        user.password = await hash(dto.newPassword, 10);
      }

      const saved = await userRepo.save(user);
      const { password, refreshToken, ...safeUser } = saved;
      return safeUser;
    });
  }

  async deleteMe(id: string): Promise<void> {
    await this.userRepository.softDelete(id);
  }
}
