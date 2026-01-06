import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Delete,
  Req,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateNicknameDto } from './dto/update-nickname.dto';
import { UpdatePasswordDto } from './dto/update-password.dto';
import type { Request } from 'express';
import { AuthGuard } from 'common/guard/auth-guard.guard';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  private getUserIdFromAuthHeader(req: Request): string {
    const authorize = req.headers['authorization'];
    if (!authorize) throw new UnauthorizedException('액세스 토큰이 없습니다.');

    const [scheme, token] = authorize.split(' ');
    if (scheme !== 'Bearer')
      throw new UnauthorizedException('Bearer 토큰 형식이 올바르지 않습니다.');
    if (!token)
      throw new UnauthorizedException('액세스 토큰이 유효하지 않습니다.');

    const payload = this.usersService.decodeAccessToken(token);
    if (!payload?.sub)
      throw new UnauthorizedException('액세스 토큰이 유효하지 않습니다.');

    return payload.sub;
  }

  @Post('signup')
  signup(@Body() createUserDto: CreateUserDto) {
    return this.usersService.create(createUserDto);
  }

  @UseGuards(AuthGuard)
  @Get('me')
  me(@Req() req: Request) {
    const userId = this.getUserIdFromAuthHeader(req);
    return this.usersService.findOne(userId);
  }

  @UseGuards(AuthGuard)
  @Patch('password')
  updatePassword(@Req() req: Request, @Body() dto: UpdatePasswordDto) {
    const userId = this.getUserIdFromAuthHeader(req);
    return this.usersService.updatePassword(userId, dto);
  }

  @UseGuards(AuthGuard)
  @Patch('nickname')
  updateNickname(@Req() req: Request, @Body() dto: UpdateNicknameDto) {
    const userId = this.getUserIdFromAuthHeader(req);
    return this.usersService.updateNickname(userId, dto);
  }

  @UseGuards(AuthGuard)
  @Delete('me')
  remove(@Req() req: Request) {
    const userId = this.getUserIdFromAuthHeader(req);
    return this.usersService.remove(userId);
  }
}
