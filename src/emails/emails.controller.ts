import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
} from '@nestjs/common';
import { EmailsService } from './emails.service';
import { CreateEmailDto } from './requestDto/create-email-request.dto';

@Controller('emails')
export class EmailsController {
  constructor(private readonly emailsService: EmailsService) {}

  // 내 이메일 이력 전체 목록 조회(이메일 페이지에서 사용)
  @Get()
  findAll() {
    return this.emailsService.findAll();
  }

  // 내 이메일 단일 조회(이메일 클릭 시 상세 아티클에 사용)
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.emailsService.findOne(+id);
  }

  // 이메일 송신(이메일 작성 페이지에서 사용/이메일 생성 + GPT 변환 + 예약 저장)
  @Post()
  create(@Body() createEmailDto: CreateEmailDto) {
    return this.emailsService.create(createEmailDto);
  }

  // 미리보기 이메일 전송(DB에 저장하지 않음)
  // @Post('/preview')
  // create(@Body() createEmailDto: CreateEmailDto) {
  //   return this.emailsService.create(createEmailDto);
  // }

  // 이메일 삭제(본인 것만 가능)
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.emailsService.remove(+id);
  }
}
