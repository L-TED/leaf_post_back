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
    res.cookie('refreshToken', refresh, {
      httpOnly: true,
      sameSite: 'strict',
      maxAge: 10 * 60 * 1000,
    });

    return { access };
  }

  @Post('/validToken')
  validToken(@Body() dto: { token: string }) {
    return this.authService.validToken(dto.token);
  }
  @Post('/refresh')
  validRefreshToken(@Req() req: Request) {
    const refreshToken = req.cookies.refreshToken;
    if (!refreshToken)
      throw new UnauthorizedException(
        '리프레시 토큰이 없습니다. 다시 로그인해주세요.',
      );

    return this.authService.validRefreshToken(refreshToken);
  }

  @Post('/logout')
  logout(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    const refreshToken = req.cookies.refreshToken;
    if (!refreshToken)
      throw new UnauthorizedException(
        '리프레시 토큰이 없습니다. 다시 로그인해주세요.',
      );

    res.clearCookie('refreshToken');
    return this.authService.logout(refreshToken);
  }
}
