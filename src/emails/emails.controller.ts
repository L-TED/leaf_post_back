import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  Req,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import { EmailsService } from './emails.service';
import { CreateEmailDto } from './requestDto/create-email-request.dto';
import { PreviewEmailDto } from './requestDto/preview-email-request.dto';
import { AuthGuard } from 'common/guard/auth-guard.guard';
import type { Request } from 'express';

@Controller('emails')
@UseGuards(AuthGuard)
export class EmailsController {
  constructor(private readonly emailsService: EmailsService) {}

  private getUserId(
    req: Request & { user?: { id?: string; userId?: string } },
  ): string {
    // NOTE: 여기 키는 프로젝트에 맞게 수정 가능
    // 예) req.user.id 또는 req.user.userId
    const userId = req.user?.id ?? req.user?.userId;
    if (!userId) throw new UnauthorizedException('인증 정보가 없습니다.');
    return userId;
  }

  // 내 이메일 이력 전체 목록 조회(이메일 페이지에서 사용)
  @Get()
  findAll(@Req() req: Request & { user?: { id?: string; userId?: string } }) {
    const userId = this.getUserId(req);
    return this.emailsService.findAll(userId);
  }

  // 내 이메일 단일 조회(이메일 클릭 시 상세 아티클에 사용)
  @Get(':id')
  findOne(
    @Req() req: Request & { user?: { id?: string; userId?: string } },
    @Param('id') id: string,
  ) {
    const userId = this.getUserId(req);
    return this.emailsService.findOne(userId, id);
  }

  // 이메일 송신(이메일 작성 페이지에서 사용/이메일 생성 + GPT 변환 + 예약 저장)
  @Post()
  create(
    @Req() req: Request & { user?: { id?: string; userId?: string } },
    @Body() createEmailDto: CreateEmailDto,
  ) {
    const userId = this.getUserId(req);
    return this.emailsService.create(userId, createEmailDto);
  }

  // 미리보기 이메일 전송(DB에 저장하지 않음)
  @Post('/preview')
  preview(
    @Req() req: Request & { user?: { id?: string; userId?: string } },
    @Body() dto: PreviewEmailDto,
  ) {
    const userId = this.getUserId(req);
    return this.emailsService.preview(userId, dto);
  }

  // 이메일 삭제(본인 것만 가능)
  @Delete(':id')
  remove(
    @Req() req: Request & { user?: { id?: string; userId?: string } },
    @Param('id') id: string,
  ) {
    const userId = this.getUserId(req);
    return this.emailsService.remove(userId, id);
  }
}
