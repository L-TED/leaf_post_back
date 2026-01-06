import { Injectable, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Users } from '../users/entities/user.entity';
import * as bcrypt from 'bcrypt';
import { TokenService } from './tokens.service';
import { RefreshTokens } from './entities/refreshToken.entity';
import { LoginDto } from './dto/login.dto';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(RefreshTokens)
    private tokenRepo: Repository<RefreshTokens>,
    @InjectRepository(Users) private usersRepo: Repository<Users>,
    private tokenService: TokenService,
    private jwtService: JwtService,
  ) {}

  async login(loginDto: LoginDto) {
    const { email, password } = loginDto;
    const user = await this.usersRepo.findOne({ where: { email } });
    if (!user) throw new UnauthorizedException('가입되지 않은 이메일입니다.');

    const comparePW = await bcrypt.compare(password, user.password);
    if (!comparePW)
      throw new UnauthorizedException('비밀번호가 올바르지 않습니다.');

    const access = this.tokenService.generateAccessToken(user.id);
    const refresh = await this.tokenService.generateRefreshToken(user.id);

    return { access, refresh };
  }

  async logout(refreshToken: string) {
    let userId: string | undefined;
    try {
      await this.jwtService.verifyAsync(refreshToken);
      const payload = this.jwtService.decode(refreshToken) as {
        sub?: string;
      } | null;
      userId = payload?.sub;
    } catch {
      throw new UnauthorizedException(
        '리프레시 토큰이 유효하지 않습니다. 다시 로그인해주세요.',
      );
    }

    if (!userId)
      throw new UnauthorizedException(
        '리프레시 토큰이 유효하지 않습니다. 다시 로그인해주세요.',
      );

    const refreshTokenRow = await this.tokenRepo.findOne({
      where: { user: { id: userId } },
      relations: { user: true },
    });
    if (!refreshTokenRow)
      throw new UnauthorizedException('로그인된 상태가 아닙니다.');

    const isSame = await bcrypt.compare(refreshToken, refreshTokenRow.token);
    if (!isSame)
      throw new UnauthorizedException(
        '리프레시 토큰이 유효하지 않습니다. 다시 로그인해주세요.',
      );

    refreshTokenRow.isRevoked = true;
    await this.tokenRepo.save(refreshTokenRow);
    return { message: '로그아웃이 완료되었습니다.' };
  }

  async validToken(token: string) {
    return this.tokenService.validateAccessToken(token);
  }
  async validRefreshToken(refreshToken: string) {
    const access = await this.tokenService.validateRefreshToken(refreshToken);
    return { access };
  }
}
