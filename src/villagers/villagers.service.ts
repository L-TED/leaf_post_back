import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Villagers } from './entities/villager.entity';
import { VillagerPreviewDTO } from './dto/villager-preview.response.dto';
import { VillagerTones } from 'src/emails/entities/villager-tones.entity';
import { RedisService } from 'src/infra/redis/redis.service';
import { In } from 'typeorm';

@Injectable()
export class VillagersService {
  constructor(
    @InjectRepository(Villagers)
    private readonly villagersRepo: Repository<Villagers>,
    @InjectRepository(VillagerTones)
    private readonly villagerTonesRepo: Repository<VillagerTones>,
    private readonly redisService: RedisService,
  ) {}

  private pickPreviewText(exampleSentences: string | null): string {
    if (!exampleSentences) return '';

    const raw = exampleSentences.trim();
    if (!raw) return '';

    // Seed는 string[] 요구사항을 JSON 문자열로 저장하고 있으므로 우선 JSON 파싱
    if (raw.startsWith('[')) {
      try {
        const parsed = JSON.parse(raw) as unknown;
        if (Array.isArray(parsed)) {
          const first = parsed[0];
          return typeof first === 'string' ? first.trim() : '';
        }
      } catch {
        // fallthrough
      }
    }

    // Fallback: plain text format (e.g. separated blocks)
    return raw.split('\n---\n')[0]?.trim() ?? '';
  }

  async findAll(): Promise<VillagerPreviewDTO[]> {
    const villagers = await this.villagersRepo.find({
      select: { id: true, name: true, imageUrl: true },
      order: { id: 'ASC' },
    });

    const tones = await this.villagerTonesRepo.find({
      select: {
        toneType: true,
        exampleSentences: true,
        villager: { id: true },
      },
      relations: { villager: true },
    });

    const previewMap = new Map<number, string>();
    const toneTypesMap = new Map<number, Set<string>>();
    for (const tone of tones) {
      const villagerId = tone.villager?.id;
      if (!villagerId) continue;

      if (tone.toneType) {
        const set = toneTypesMap.get(villagerId) ?? new Set<string>();
        set.add(tone.toneType);
        toneTypesMap.set(villagerId, set);
      }

      const preview = this.pickPreviewText(tone.exampleSentences);
      if (preview && !previewMap.get(villagerId))
        previewMap.set(villagerId, preview);
    }

    return villagers.map((v) => ({
      id: v.id,
      name: v.name,
      imageUrl: v.imageUrl,
      previewText: previewMap.get(v.id) ?? '',
      usageCount: 0,
      tones: Array.from(toneTypesMap.get(v.id) ?? new Set<string>())
        .sort()
        .map((toneType) => ({ toneType })),
    }));
  }

  async findPopular(limit?: number): Promise<VillagerPreviewDTO[]> {
    const safeLimit = Number.isFinite(limit)
      ? Math.max(1, Math.min(100, Math.floor(limit as number)))
      : 8;

    const ranked = await this.redisService.getTopVillagers(safeLimit);

    // Redis가 비어있거나 실패하면 기존 정렬로 fallback
    if (ranked.length === 0) {
      const fallback = await this.findAll();
      return fallback.slice(0, safeLimit).map((v) => ({ ...v, usageCount: 0 }));
    }

    const rankedIds = ranked.map((r) => r.villagerId);
    const scoreMap = new Map<number, number>();
    for (const r of ranked) scoreMap.set(r.villagerId, Math.floor(r.score));

    const villagers = await this.villagersRepo.find({
      select: { id: true, name: true, imageUrl: true },
      where: { id: In(rankedIds) },
    });
    const villagerById = new Map(villagers.map((v) => [v.id, v] as const));

    const tones = await this.villagerTonesRepo.find({
      select: {
        toneType: true,
        exampleSentences: true,
        villager: { id: true },
      },
      where: {
        villager: { id: In(rankedIds) },
      },
      relations: { villager: true },
    });

    const previewMap = new Map<number, string>();
    const toneTypesMap = new Map<number, Set<string>>();
    for (const tone of tones) {
      const villagerId = tone.villager?.id;
      if (!villagerId) continue;

      if (tone.toneType) {
        const set = toneTypesMap.get(villagerId) ?? new Set<string>();
        set.add(tone.toneType);
        toneTypesMap.set(villagerId, set);
      }

      const preview = this.pickPreviewText(tone.exampleSentences);
      if (preview && !previewMap.get(villagerId))
        previewMap.set(villagerId, preview);
    }

    // Redis ranking 순서 그대로 정렬 유지
    return rankedIds
      .map((id) => {
        const v = villagerById.get(id);
        if (!v) return null;

        return {
          id: v.id,
          name: v.name,
          imageUrl: v.imageUrl,
          previewText: previewMap.get(v.id) ?? '',
          usageCount: scoreMap.get(v.id) ?? 0,
          tones: Array.from(toneTypesMap.get(v.id) ?? new Set<string>())
            .sort()
            .map((toneType) => ({ toneType })),
        } satisfies VillagerPreviewDTO;
      })
      .filter((v): v is VillagerPreviewDTO => v !== null);
  }

  async findOne(id: number): Promise<VillagerPreviewDTO> {
    if (!Number.isFinite(id)) {
      throw new BadRequestException('유효하지 않은 주민 ID입니다.');
    }

    const villager = await this.villagersRepo.findOne({
      where: { id },
      relations: { villagerTones: true },
    });
    if (!villager) {
      throw new NotFoundException('주민을 찾을 수 없습니다.');
    }

    const toneTypes = new Set<string>();
    let previewText = '';
    for (const tone of villager.villagerTones ?? []) {
      if (tone.toneType) toneTypes.add(tone.toneType);
      if (!previewText)
        previewText = this.pickPreviewText(tone.exampleSentences);
    }

    return {
      id: villager.id,
      name: villager.name,
      imageUrl: villager.imageUrl,
      previewText,
      usageCount: 0,
      tones: Array.from(toneTypes)
        .sort()
        .map((toneType) => ({ toneType })),
    };
  }
}
