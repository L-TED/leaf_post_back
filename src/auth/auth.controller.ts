import {
  Body,
  Controller,
  Post,
  Req,
  Res,
  UnauthorizedException,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import type { Response, Request } from 'express';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('/login')
  async login(
    @Body() loginDto: LoginDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const { access, refresh } = await this.authService.login(loginDto);

    const isProd = process.env.NODE_ENV === 'production';

    // accessToken: API 호출용 (AuthGuard가 쿠키/헤더 모두 지원)
    res.cookie('accessToken', access, {
      httpOnly: true,
      sameSite: isProd ? 'none' : 'strict',
      secure: isProd,
      path: '/',
      maxAge: 15 * 60 * 1000,
    });

    res.cookie('refreshToken', refresh, {
      httpOnly: true,
      sameSite: isProd ? 'none' : 'strict',
      secure: isProd,
      path: '/',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    // 프론트 호환: accessToken 키로도 내려줌
    return { accessToken: access, access };
  }

  @Post('/validToken')
  validToken(@Body() dto: { token: string }) {
    return this.authService.validToken(dto.token);
  }
  @Post('/refresh')
  validRefreshToken(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const refreshToken = req.cookies.refreshToken;
    if (!refreshToken)
      throw new UnauthorizedException(
        '리프레시 토큰이 없습니다. 다시 로그인해주세요.',
      );

    return this.authService
      .validRefreshToken(refreshToken)
      .then(({ access }) => {
        const isProd = process.env.NODE_ENV === 'production';
        res.cookie('accessToken', access, {
          httpOnly: true,
          sameSite: isProd ? 'none' : 'strict',
          secure: isProd,
          path: '/',
          maxAge: 15 * 60 * 1000,
        });
        return { accessToken: access, access };
      });
  }

  @Post('/logout')
  logout(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    const refreshToken = req.cookies.refreshToken;
    if (!refreshToken)
      throw new UnauthorizedException(
        '리프레시 토큰이 없습니다. 다시 로그인해주세요.',
      );

    const isProd = process.env.NODE_ENV === 'production';
    res.clearCookie('accessToken', {
      httpOnly: true,
      sameSite: isProd ? 'none' : 'strict',
      secure: isProd,
      path: '/',
    });
    res.clearCookie('refreshToken', {
      httpOnly: true,
      sameSite: isProd ? 'none' : 'strict',
      secure: isProd,
      path: '/',
    });
    return this.authService.logout(refreshToken);
  }
}
