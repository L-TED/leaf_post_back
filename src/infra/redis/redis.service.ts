import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Redis } from '@upstash/redis';

type UpstashZSetEntry = {
  member: string;
  score: number;
};

@Injectable()
export class RedisService {
  private readonly logger = new Logger(RedisService.name);
  private readonly client: Redis | null;

  // key (prefix 적용 전 기본값)
  private readonly VILLAGERS_RANK_ALL_KEY = 'villagers:rank:all';

  constructor(private readonly configService: ConfigService) {
    const url = this.configService.get<string>('UPSTASH_REDIS_REST_URL');
    const token = this.configService.get<string>('UPSTASH_REDIS_REST_TOKEN');

    if (!url || !token) {
      this.client = null;
      this.logger.warn(
        'Upstash Redis env missing; Redis features are disabled.',
      );
      return;
    }

    try {
      // Upstash REST URL is HTTPS (TLS). URL/TOKEN are provided via env.
      this.client = new Redis({ url, token });
    } catch {
      this.client = null;
      this.logger.error(
        'Failed to initialize Upstash Redis client; Redis features are disabled.',
      );
    }
  }

  async incrementVillagerUsage(villagerId: number): Promise<void> {
    if (!Number.isFinite(villagerId) || villagerId <= 0) return;
    if (!this.client) return;

    try {
      // member: villagerId(string), score: 누적 사용량
      await this.client.zincrby(
        this.VILLAGERS_RANK_ALL_KEY,
        1,
        String(villagerId),
      );
    } catch {
      // Redis 장애가 핵심 기능(emails create)을 막으면 안 됨
      this.logger.warn('Redis increment failed (ignored).');
    }
  }

  async getTopVillagers(
    limit: number,
  ): Promise<Array<{ villagerId: number; score: number }>> {
    if (!this.client) return [];

    const safeLimit = Number.isFinite(limit)
      ? Math.max(1, Math.min(100, Math.floor(limit)))
      : 8;

    try {
      const entries = (await this.client.zrange(
        this.VILLAGERS_RANK_ALL_KEY,
        0,
        safeLimit - 1,
        {
          rev: true,
          withScores: true,
        },
      )) as unknown as UpstashZSetEntry[];

      if (!Array.isArray(entries)) return [];

      return entries
        .map((e) => {
          const villagerId = Number.parseInt(String(e.member), 10);
          const score = Number(e.score);
          if (!Number.isFinite(villagerId) || villagerId <= 0) return null;
          if (!Number.isFinite(score)) return null;
          return { villagerId, score };
        })
        .filter((v): v is { villagerId: number; score: number } => v !== null);
    } catch {
      this.logger.warn('Redis getTopVillagers failed (fallback to DB).');
      return [];
    }
  }
}
