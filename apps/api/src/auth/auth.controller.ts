import { BadRequestException, Body, Controller, Post, Req, Res, UseGuards } from '@nestjs/common';
import type { Request, Response } from 'express';
import { AuthService } from './auth.service';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { Public } from '../common/decorators/public.decorator';
import { LoginDto } from './dto/login.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { RegisterDto } from './dto/register.dto';

const REFRESH_TOKEN_COOKIE = 'refreshToken';
const REFRESH_TOKEN_MAX_AGE_DAYS = 7;

@Controller('auth')
export class AuthController {
    constructor(private readonly authService: AuthService) {}

    private setRefreshTokenCookie(res: Response, refreshToken: string) {
        res.cookie(REFRESH_TOKEN_COOKIE, refreshToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            path: '/',
            maxAge: REFRESH_TOKEN_MAX_AGE_DAYS * 24 * 60 * 60 * 1000,
        });
    }

    private clearRefreshTokenCookie(res: Response) {
        res.clearCookie(REFRESH_TOKEN_COOKIE, { path: '/' });
    }

    @Post('register')
    @Public()
    async register(@Body() registerDto: RegisterDto, @Res({ passthrough: true }) res: Response) {
        const { accessToken, refreshToken } = await this.authService.register(registerDto);
        this.setRefreshTokenCookie(res, refreshToken);
        return { accessToken };
    }

    @Post('login')
    @Public()
    async login(@Body() loginDto: LoginDto, @Res({ passthrough: true }) res: Response) {
        const { accessToken, refreshToken } = await this.authService.login(loginDto);
        this.setRefreshTokenCookie(res, refreshToken);
        return { accessToken };
    }

    @Post('refresh-token')
    @Public()
    async refreshToken(
        @Req() req: Request,
        @Body() refreshTokenDto: RefreshTokenDto,
        @Res({ passthrough: true }) res: Response,
    ) {
        const token =
            req.cookies?.[REFRESH_TOKEN_COOKIE] ?? refreshTokenDto?.refreshToken;
        if (!token) {
            throw new BadRequestException('Refresh token is required (cookie or body)');
        }
        const { accessToken, refreshToken } = await this.authService.refreshToken({
            refreshToken: token,
        });
        this.setRefreshTokenCookie(res, refreshToken);
        return { accessToken };
    }

    @Post('logout')
    @UseGuards(JwtAuthGuard)
    async logout(@CurrentUser('id') userId: string, @Res({ passthrough: true }) res: Response) {
        await this.authService.logout(userId);
        this.clearRefreshTokenCookie(res);
        return { message: 'Logged out successfully' };
    }
}
