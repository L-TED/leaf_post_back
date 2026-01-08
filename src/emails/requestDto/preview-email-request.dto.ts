import { Transform } from 'class-transformer';
import {
  IsEmail,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';

export class PreviewEmailDto {
  // --- Front legacy keys (optional) ---
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsOptional()
  @IsEmail()
  @MaxLength(255)
  toEmail?: string;

  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsOptional()
  @IsEmail()
  @MaxLength(255)
  fromEmail?: string;

  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  content?: string;

  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  subject?: string;

  // receiverEmail:
  // 프론트에서 payload로 재사용 가능한 값,
  @Transform(({ value, obj }) => {
    const raw = value ?? (obj as { toEmail?: unknown }).toEmail;
    return typeof raw === 'string' ? raw.trim() : raw;
  })
  @IsEmail()
  @MaxLength(255)
  receiverEmail: string;

  // originalText:
  // GPT 입련 텍스트, 필수값
  @Transform(({ value, obj }) => {
    const raw = value ?? (obj as { content?: unknown }).content;
    return typeof raw === 'string' ? raw.trim() : raw;
  })
  @IsString()
  @IsNotEmpty()
  originalText: string;

  // villagerId:
  // create-email-request.dto.ts와 동일
  // preview와 create의 변환 결과가 반드시 동일 해야 함
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
  // create-email-request.dto.ts와 동일
  // preview와 create의 변환 결과가 반드시 동일 해야 함
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsString()
  @IsNotEmpty()
  @MaxLength(20)
  toneType: string;
}
