import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(private jwtService: JwtService) {}
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest(); // req로 변환
    const authorize = req.headers['authorization'];
    if (!authorize)
      throw new UnauthorizedException('토큰이 존재하지 않습니다.');
    const [a, b] = authorize.split(' ');
    if (a != 'Bearer') throw new UnauthorizedException('유효하지 않은 토큰');
    if (!b) throw new UnauthorizedException('토큰이 유효하지 않습니다');
    try {
      await this.jwtService.verifyAsync(b);
      return true;
    } catch (error) {
      throw new UnauthorizedException('토큰이 유효하지 않습니다.');
    }
  }
}
