import { Injectable, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';

import { Repository } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { RefreshTokens } from './entities/refreshToken.entity';
import { Users } from '../users/entities/user.entity';

@Injectable()
export class TokenService {
  constructor(
    @InjectRepository(RefreshTokens)
    private tokenRepo: Repository<RefreshTokens>,
    private jwtService: JwtService,
  ) {}

  generateAccessToken(userId: string) {
    return this.jwtService.sign({ sub: userId }, { expiresIn: '15m' });
  }

  validateAccessToken(token: string) {
    return this.jwtService.verify(token);
  }

  async generateRefreshToken(userId: string) {
    const refreshToken = this.jwtService.sign(
      { sub: userId },
      { expiresIn: '7d' },
    );

    const target = await this.tokenRepo.findOne({
      where: { user: { id: userId } },
    });
    if (target) await this.tokenRepo.remove(target);

    const hashedToken = await bcrypt.hash(refreshToken, 10);
    const newToken = await this.tokenRepo.create({
      token: hashedToken,
      user: { id: userId } as Users,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    });
    await this.tokenRepo.save(newToken);
    return refreshToken;
  }
  async validateRefreshToken(token: string) {
    try {
      await this.jwtService.verify(token);
      const payload = this.jwtService.decode(token) as { sub?: string } | null;
      const userId = payload?.sub;
      if (!userId)
        throw new UnauthorizedException(
          '리프레시 토큰이 유효하지 않습니다. 다시 로그인해주세요.',
        );

      const getToken = await this.tokenRepo.findOne({
        where: { user: { id: userId } },
      });
      if (!getToken)
        throw new UnauthorizedException(
          '리프레시 토큰이 없습니다. 다시 로그인해주세요.',
        );

      const isSame = await bcrypt.compare(token, getToken?.token ?? '');
      if (!isSame)
        throw new UnauthorizedException(
          '리프레시 토큰이 유효하지 않습니다. 다시 로그인해주세요.',
        );

      if (getToken.isRevoked)
        throw new UnauthorizedException(
          '리프레시 토큰이 만료되었거나 폐기되었습니다. 다시 로그인해주세요.',
        );

      if (getToken.expiresAt < new Date())
        throw new UnauthorizedException(
          '리프레시 토큰이 만료되었습니다. 다시 로그인해주세요.',
        );

      return await this.generateAccessToken(userId);
    } catch (e) {
      throw new UnauthorizedException(
        '리프레시 토큰이 유효하지 않습니다. 다시 로그인해주세요.',
      );
    }
  }
}
