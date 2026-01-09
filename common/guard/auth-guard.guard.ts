import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import type { Response } from 'express';
import { TokenService } from 'src/auth/tokens.service';
import { getAccessTokenCookieOptions } from 'src/auth/cookie-options';

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    private jwtService: JwtService,
    private tokenService: TokenService,
  ) {}
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest(); // req로 변환
    const res: Response = context.switchToHttp().getResponse();

    const authorize = req.headers['authorization'];
    let token: string | undefined;
    if (typeof authorize === 'string' && authorize.trim().length > 0) {
      const [scheme, value] = authorize.split(' ');
      if (scheme !== 'Bearer')
        throw new UnauthorizedException(
          'Bearer 토큰 형식이 올바르지 않습니다.',
        );
      token = value;
    }

    // 헤더가 없으면 쿠키(accessToken)로도 허용
    if (!token) {
      token = req.cookies?.accessToken;
    }

    if (!token) {
      const refreshToken = req.cookies?.refreshToken;
      if (!refreshToken)
        throw new UnauthorizedException('액세스 토큰이 없습니다.');

      const access = await this.tokenService.validateRefreshToken(refreshToken);
      res.cookie('accessToken', access, getAccessTokenCookieOptions());

      const payload = await this.jwtService.verifyAsync(access);
      const userId =
        payload &&
        typeof payload === 'object' &&
        'sub' in payload &&
        typeof (payload as { sub?: unknown }).sub === 'string'
          ? ((payload as { sub?: string }).sub as string)
          : undefined;

      if (!userId)
        throw new UnauthorizedException('액세스 토큰이 유효하지 않습니다.');

      req.user = { ...(req.user ?? {}), id: userId, userId };
      return true;
    }
    try {
      const payload = await this.jwtService.verifyAsync(token);

      const userId =
        payload &&
        typeof payload === 'object' &&
        'sub' in payload &&
        typeof (payload as { sub?: unknown }).sub === 'string'
          ? ((payload as { sub?: string }).sub as string)
          : undefined;

      if (!userId)
        throw new UnauthorizedException('액세스 토큰이 유효하지 않습니다.');

      // 컨트롤러에서 프로젝트 방식대로 꺼내 쓰도록 req.user를 세팅
      req.user = { ...(req.user ?? {}), id: userId, userId };
      return true;
    } catch (error) {
      const refreshToken = req.cookies?.refreshToken;
      if (!refreshToken)
        throw new UnauthorizedException('액세스 토큰이 유효하지 않습니다.');

      const access = await this.tokenService.validateRefreshToken(refreshToken);
      res.cookie('accessToken', access, getAccessTokenCookieOptions());

      const payload = await this.jwtService.verifyAsync(access);
      const userId =
        payload &&
        typeof payload === 'object' &&
        'sub' in payload &&
        typeof (payload as { sub?: unknown }).sub === 'string'
          ? ((payload as { sub?: string }).sub as string)
          : undefined;

      if (!userId)
        throw new UnauthorizedException('액세스 토큰이 유효하지 않습니다.');

      req.user = { ...(req.user ?? {}), id: userId, userId };
      return true;
    }
  }
}
