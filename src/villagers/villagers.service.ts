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

@Injectable()
export class VillagersService {
  constructor(
    @InjectRepository(Villagers)
    private readonly villagersRepo: Repository<Villagers>,
    @InjectRepository(VillagerTones)
    private readonly villagerTonesRepo: Repository<VillagerTones>,
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
        exampleSentences: true,
        villager: { id: true },
      },
      relations: { villager: true },
    });

    const toneMap = new Map<number, string>();
    for (const tone of tones) {
      const villagerId = tone.villager?.id;
      if (!villagerId) continue;

      const preview = this.pickPreviewText(tone.exampleSentences);
      if (preview) toneMap.set(villagerId, preview);
    }

    return villagers.map((v) => ({
      id: v.id,
      name: v.name,
      imageUrl: v.imageUrl,
      previewText: toneMap.get(v.id) ?? '',
    }));
  }

  async findOne(id: number) {
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

    return villager;
  }
}
