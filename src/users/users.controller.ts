import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Delete,
  Req,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  ParseFilePipe,
  MaxFileSizeValidator,
  FileTypeValidator,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateNicknameDto } from './dto/update-nickname.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import type { Request } from 'express';
import { AuthGuard } from 'common/guard/auth-guard.guard';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  private getUserId(
    req: Request & { user?: { id?: string; userId?: string } },
  ) {
    const userId = req.user?.id ?? req.user?.userId;
    // AuthGuard가 이미 검증/주입하므로 여기서는 방어적으로만 체크
    if (!userId) throw new Error('인증 정보가 없습니다.');
    return userId;
  }

  @Post('signup')
  @UseInterceptors(
    FileInterceptor('profileImage', {
      storage: memoryStorage(),
    }),
  )
  signup(
    @Body() createUserDto: CreateUserDto,
    @UploadedFile(
      new ParseFilePipe({
        fileIsRequired: false,
        validators: [
          new MaxFileSizeValidator({ maxSize: 5 * 1024 * 1024 }),
          new FileTypeValidator({ fileType: /(png|jpg|jpeg)$/ }),
        ],
      }),
    )
    file?: Express.Multer.File,
  ) {
    return this.usersService.create(createUserDto, file);
  }

  @UseGuards(AuthGuard)
  @Get('me')
  me(@Req() req: Request & { user?: { id?: string; userId?: string } }) {
    const userId = this.getUserId(req);
    return this.usersService.findOne(userId);
  }

  @UseGuards(AuthGuard)
  @Patch('nickname')
  updateNickname(
    @Req() req: Request & { user?: { id?: string; userId?: string } },
    @Body() dto: UpdateNicknameDto,
  ) {
    const userId = this.getUserId(req);
    return this.usersService.updateNickname(userId, dto);
  }

  @UseGuards(AuthGuard)
  @Patch('profile')
  @UseInterceptors(
    FileInterceptor('profileImage', {
      storage: memoryStorage(),
    }),
  )
  updateProfile(
    @Req() req: Request & { user?: { id?: string; userId?: string } },
    @Body() _dto: UpdateProfileDto,
    @UploadedFile(
      new ParseFilePipe({
        fileIsRequired: true,
        validators: [
          new MaxFileSizeValidator({ maxSize: 5 * 1024 * 1024 }),
          new FileTypeValidator({ fileType: /(png|jpg|jpeg)$/ }),
        ],
      }),
    )
    file: Express.Multer.File,
  ) {
    const userId = this.getUserId(req);
    return this.usersService.updateProfile(userId, file);
  }

  @UseGuards(AuthGuard)
  @Delete('me')
  remove(@Req() req: Request & { user?: { id?: string; userId?: string } }) {
    const userId = this.getUserId(req);
    return this.usersService.remove(userId);
  }
}
