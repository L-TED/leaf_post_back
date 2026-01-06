import {
  Injectable,
  InternalServerErrorException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { randomUUID } from 'crypto';

@Injectable()
export class SupabaseService {
  private readonly supabase: SupabaseClient;

  constructor(private readonly configService: ConfigService) {
    const url = this.configService.get<string>('SUPABASE_URL');
    const anonKey = this.configService.get<string>('SUPABASE_ANON_KEY');

    if (!url || !anonKey) {
      throw new InternalServerErrorException(
        'Supabase 설정이 올바르지 않습니다.',
      );
    }

    this.supabase = createClient(url, anonKey);
  }

  async uploadProfileImage(file: Express.Multer.File): Promise<string> {
    try {
      if (!file?.buffer) {
        throw new InternalServerErrorException(
          '업로드할 파일 데이터가 없습니다.',
        );
      }

      const bucket = 'profile-images';

      const contentType = file.mimetype;
      const extension = this.getExtensionFromMimeType(contentType);
      const path = `users/${randomUUID()}.${extension}`;

      const { error } = await this.supabase.storage
        .from(bucket)
        .upload(path, file.buffer, {
          contentType,
          upsert: true,
        });

      if (error) {
        throw new ServiceUnavailableException(
          '프로필 이미지 업로드에 실패했습니다.',
        );
      }

      const { data } = this.supabase.storage.from(bucket).getPublicUrl(path);
      const publicUrl = data?.publicUrl;
      if (!publicUrl) {
        throw new InternalServerErrorException(
          '업로드된 이미지 URL을 생성할 수 없습니다.',
        );
      }

      return publicUrl;
    } catch (err) {
      if (
        err instanceof InternalServerErrorException ||
        err instanceof ServiceUnavailableException
      ) {
        throw err;
      }

      throw new ServiceUnavailableException(
        '프로필 이미지 업로드에 실패했습니다.',
      );
    }
  }

  private getExtensionFromMimeType(mimeType: string): 'png' | 'jpg' | 'jpeg' {
    if (mimeType === 'image/png') return 'png';
    if (mimeType === 'image/jpg') return 'jpg';
    if (mimeType === 'image/jpeg') return 'jpeg';
    return 'jpeg';
  }
}
