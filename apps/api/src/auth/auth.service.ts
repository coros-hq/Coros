import { compare, hash } from 'bcryptjs';
import {
  BadRequestException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { MoreThan, Repository } from 'typeorm';
import { User } from '../user/entities/user.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Organization } from '../organization/entities/organization.entity';
import { LoginDto } from './dto/login.dto';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { RefreshToken } from './entities/refreshToken.entity';
import { RegisterDto } from './dto/register.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { OrganizationSize, Role } from '@org/shared-types';
import { randomBytes } from 'crypto';
import { IndustryService } from '../industry/industry.service';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(Organization)
    private organizationRepository: Repository<Organization>,
    @InjectRepository(RefreshToken)
    private refreshTokenRepository: Repository<RefreshToken>,
    private jwtService: JwtService,
    private configService: ConfigService,
    private industryService: IndustryService,
  ) {}

  async findbByEmail(email: string) {
    if (!email) {
      throw new BadRequestException('Email is required');
    }

    return this.userRepository.findOne({ where: { email } });
  }

  async findOrganizationById(organizationId: string) {
    if (!organizationId) {
      throw new BadRequestException('Organization ID is required');
    }

    return this.organizationRepository.findOne({
      where: { id: organizationId },
    });
  }

  async validateUser(credentials: LoginDto) {
    const user = await this.findbByEmail(credentials.email);

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const isPasswordValid = await compare(credentials.password, user.password);

    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    if (!user.isActive) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const organization = await this.findOrganizationById(user.organizationId);
    if (!organization || !organization.isActive) {
      throw new UnauthorizedException('Invalid credentials');
    }

    return user;
  }

  private slugify(value: string): string {
    return value
      .toLowerCase()
      .trim()
      .replace(/\s+/g, '-')
      .replace(/[^\w-]+/g, '')
      .replace(/-+/g, '-');
  }

  /** Returns a value valid for JWT expiresIn: number of seconds or timespan string (e.g. '15m', '7d'). */
  private getJwtExpiresIn(key: string, defaultVal: string): number | string {
    const val = this.configService.get<string>(key);
    if (typeof val !== 'string' || val.length === 0) return defaultVal;
    const num = Number(val);
    if (!Number.isNaN(num) && num >= 0 && Number.isInteger(num)) return num;
    if (/^\d+[smhd]$/.test(val)) return val;
    return defaultVal;
  }

  async register(registerDto: RegisterDto) {
    if (!registerDto) {
      throw new BadRequestException('Register data is required');
    }

    const existingUser = await this.userRepository.findOne({
      where: { email: registerDto.email },
    });
    if (existingUser) {
      throw new BadRequestException('User already exists');
    }

    if (registerDto.industryId) {
      const industryExists = await this.industryService.exists(
        registerDto.industryId,
      );
      if (!industryExists) {
        throw new BadRequestException('Invalid industry');
      }
    }

    const slug = this.slugify(registerDto.organizationName);

    const organization = this.organizationRepository.create({
      name: registerDto.organizationName,
      slug,
      logoUrl: null,
      brandColor: null,
      website: '',
      size: registerDto.size || OrganizationSize.XS,
      isActive: true,
      industryId: registerDto.industryId ?? null,
    });
    const savedOrganization = await this.organizationRepository.save(organization);

    const hashedPassword = await hash(registerDto.password, 10);
    const newUser = this.userRepository.create({
      email: registerDto.email,
      password: hashedPassword,
      role: Role.ADMIN,
      isActive: true,
      organizationId: savedOrganization.id,
    });
    const savedUser = await this.userRepository.save(newUser);

    return this.generateTokens(savedUser);
  }

  async login(credentials: LoginDto) {
    if(!credentials) {
        throw new BadRequestException('Credentials are required');
    }

    const user = await this.validateUser(credentials);

    if (!user) {
      throw new UnauthorizedException('Invalid user');
    }

    return this.generateTokens(user);
  }

  async refreshToken(refreshTokenDto: RefreshTokenDto) {
    if (!refreshTokenDto?.refreshToken) {
      throw new BadRequestException('Refresh token is required');
    }

    const now = new Date();
    const storedTokens = await this.refreshTokenRepository.find({
      where: { expiresAt: MoreThan(now) },
    });
    let matchedToken: RefreshToken | null = null;
    for (const st of storedTokens) {
      if (st.expiresAt < now) continue;
      const tokenMatches = await compare(
        refreshTokenDto.refreshToken,
        st.token,
      );
      if (tokenMatches) {
        matchedToken = st;
        break;
      }
    }
    if (!matchedToken) {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }

    const user = await this.userRepository.findOne({
      where: { id: matchedToken.userId },
    });
    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    if (!user.isActive) {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }

    const organization = await this.findOrganizationById(user.organizationId);
    if (!organization || !organization.isActive) {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }

    return this.generateTokens(user);
  }

  async logout(userId: string): Promise<void> {
    await this.refreshTokenRepository.delete({ userId });
  }

  private async generateTokens(user: User) {
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    const payload = {
      sub: user.id,
      email: user.email,
      role: user.role,
      organizationId: user.organizationId,
    };
  
    const accessExpiresIn = this.getJwtExpiresIn('JWT_ACCESS_EXPIRES_IN', '15m');
    const jwtExpiresIn = (v: number | string) => v as number | `${number}s` | `${number}m` | `${number}h` | `${number}d`;
  
    const accessToken = await this.jwtService.signAsync(payload, {
      secret: this.configService.getOrThrow<string>('JWT_ACCESS_SECRET'),
      expiresIn: jwtExpiresIn(accessExpiresIn),
    });
  
    const refreshToken = randomBytes(64).toString('hex');
    const hashedRefreshToken = await hash(refreshToken, 10);
  
    let refreshTokenEntity = await this.refreshTokenRepository.findOne({
      where: { userId: user.id },
    });
  
    if (refreshTokenEntity) {
      refreshTokenEntity.token = hashedRefreshToken;
      refreshTokenEntity.expiresAt = expiresAt;
    } else {
      refreshTokenEntity = this.refreshTokenRepository.create({
        userId: user.id,
        token: hashedRefreshToken,
        expiresAt,
      });
    }
  
    await this.refreshTokenRepository.save(refreshTokenEntity);
  
    return { accessToken, refreshToken };
  }
}
