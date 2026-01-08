import { Transform } from 'class-transformer';
import {
  IsDateString,
  IsEmail,
  IsInt,
  IsNotEmpty,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';

export class CreateEmailDto {
  // receiverEmail:
  // 이메일 수신자, service create에서 이메일 entity 사용 시 필요
  // senderEmail은 “로그인한 사용자”로 서버가 결정
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsEmail()
  @MaxLength(255)
  receiverEmail: string;

  // originalText:
  // GPT 변환의 입력 원문, GPT 변환 입력에 사용, DB에 original_text로 저장
  // 왜 transformedText는 없나? => 변환 결과는 서버/GPT의 산출물
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsString()
  @IsNotEmpty()
  originalText: string;

  // villagerId:
  // 어떤 주민(캐릭터)의 말투를 쓸지, villager_tones 조회의 기준값
  @Transform(({ value }) => {
    if (typeof value === 'number') return value;
    if (typeof value === 'string' && value.trim().length > 0)
      return Number(value);
    return value;
  })
  @IsInt()
  @Min(1)
  villagerId: number;

  // toneType:
  // 해당 주민의 어떤 톤 전략을 쓸지
  // 값: RULE | GPT | HYBRID
  // villager_tones 조회의 기준값, GPT 프롬프트 분기
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsString()
  @IsNotEmpty()
  @MaxLength(20)
  toneType: string;

  // scheduledAt:
  // 언제 발송할지
  // Email Entity 생성 시 필요한 값
  // 크론에서 “발송 대상인지” 판단
  // 왜 status는 없나? => 예약 생성 = 무조건 reserved
  // ISO 8601 string (e.g. 2026-01-08T12:34:56.000Z)
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsDateString()
  scheduledAt: string;
}
