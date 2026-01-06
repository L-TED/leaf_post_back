import { Transform } from 'class-transformer';
import {
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUrl,
  MaxLength,
  MinLength,
} from 'class-validator';

export class SignupDto {
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsEmail({}, { message: '유효하지 않은 이메일 형식입니다.' })
  @MaxLength(255)
  email: string;

  @IsString()
  @IsNotEmpty({ message: '비밀번호는 비워둘 수 없습니다.' })
  @MinLength(8, {
    message: '비밀번호가 너무 짧습니다. 최소 8자 이상이어야 합니다.',
  })
  @MaxLength(72)
  password: string;

  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsString()
  @IsNotEmpty({ message: '닉네임은 비워둘 수 없습니다.' })
  @MaxLength(50)
  nickname: string;

  @Transform(({ value }) => {
    if (typeof value !== 'string') return value;
    const trimmed = value.trim();
    return trimmed.length === 0 ? undefined : trimmed;
  })
  @IsOptional()
  @IsUrl({ require_protocol: true })
  profileImageUrl?: string;
}
