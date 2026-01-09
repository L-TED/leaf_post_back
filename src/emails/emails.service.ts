import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { randomUUID } from 'crypto';

import { CreateEmailDto } from './requestDto/create-email-request.dto';
import { PreviewEmailDto } from './requestDto/preview-email-request.dto';
import { Emails } from './entities/email.entity';
import { Users } from 'src/users/entities/user.entity';
import { Villagers } from 'src/villagers/entities/villager.entity';
import { VillagerTones } from './entities/villager-tones.entity';
import { GeminiService } from 'src/infra/gemini/gemini.service';
import { EmailDetailResponseDto } from './responseDto/email-detail-response.dto';
import { EmailListItemResponseDto } from './responseDto/email-list-item-response.dto';
import { RedisService } from 'src/infra/redis/redis.service';
import { Logger } from '@nestjs/common';

@Injectable()
export class EmailsService {
  private readonly logger = new Logger(EmailsService.name);

  constructor(
    @InjectRepository(Emails)
    private readonly emailsRepo: Repository<Emails>,
    @InjectRepository(Users)
    private readonly usersRepo: Repository<Users>,
    @InjectRepository(Villagers)
    private readonly villagersRepo: Repository<Villagers>,
    @InjectRepository(VillagerTones)
    private readonly villagerTonesRepo: Repository<VillagerTones>,
    private readonly geminiService: GeminiService,
    private readonly redisService: RedisService,
  ) {}

  private normalizeText(text: string): string {
    return (text ?? '').replace(/\r\n/g, '\n').trim();
  }

  private applyPreviewRules(input: {
    originalText: string;
    sentenceEnding?: string | null;
    maxLength?: number | null;
    forbidEmotion?: boolean | null;
  }): string {
    let text = this.normalizeText(input.originalText);

    // 최소한의 결정적(deterministic) 후처리만 수행
    if (input.forbidEmotion) {
      // 과도한 감정 표현/기호를 약하게 정리 (과격한 필터링은 피함)
      text = text.replace(/[!！]+/g, '.');
      text = text.replace(/[~〜]+/g, '');
    }

    const ending = (input.sentenceEnding ?? '').trim();
    if (ending.length > 0) {
      // 이미 끝맺음이 포함되어 있으면 중복 부착하지 않음
      if (!text.endsWith(ending)) {
        text = `${text}${ending}`;
      }
    }

    // 공백 포함 최대 길이 제한
    if (input.maxLength != null && Number.isFinite(input.maxLength)) {
      const max = Math.max(1, Math.floor(input.maxLength));
      if (text.length > max) text = text.slice(0, max).trimEnd();
    }

    // 연속 줄바꿈 과다 방지
    text = text.replace(/\n{3,}/g, '\n\n');

    return text;
  }

  private buildSystemPrompt(tone: VillagerTones, villager: Villagers): string {
    const parts: string[] = [];

    if (tone.systemPrompt) parts.push(tone.systemPrompt.trim());
    parts.push(`캐릭터: ${villager.name}`);
    parts.push(`톤 타입: ${tone.toneType}`);
    if (tone.speechStyle) parts.push(`말투: ${tone.speechStyle}`);
    if (tone.sentenceEnding) parts.push(`문장 끝 패턴: ${tone.sentenceEnding}`);
    if (tone.personalityKeywords)
      parts.push(`성격 키워드: ${tone.personalityKeywords}`);
    if (tone.exampleSentences)
      parts.push(`예시 문장: ${tone.exampleSentences}`);
    if (tone.maxLength != null) parts.push(`최대 길이: ${tone.maxLength}`);
    if (tone.forbidEmotion) parts.push('감정 과다 표현 금지');

    return parts.join('\n');
  }

  private async getVillagerToneOrThrow(villagerId: number, toneType: string) {
    const tone = await this.villagerTonesRepo.findOne({
      where: {
        villager: { id: villagerId },
        toneType,
      },
      relations: {
        villager: true,
      },
    });

    if (!tone) {
      throw new BadRequestException(
        '해당 villagerId/toneType 조합의 말투 데이터를 찾을 수 없습니다.',
      );
    }

    if (!tone.villager) {
      throw new BadRequestException(
        '말투 데이터의 villager 정보가 누락되었습니다.',
      );
    }

    return tone;
  }

  async preview(
    userId: string,
    dto: PreviewEmailDto,
  ): Promise<{ transformedText: string }> {
    if (!userId) throw new BadRequestException('userId가 필요합니다.');

    const tone = await this.getVillagerToneOrThrow(
      dto.villagerId,
      dto.toneType,
    );
    const systemPrompt = this.buildSystemPrompt(tone, tone.villager);

    // Preview는 UX 안정성을 위해 결정적 결과를 반환해야 하며,
    // 외부 API 비용/장애에 민감하므로 LLM(Gemini) 호출을 피한다.
    // (최종 create 단계에서만 Gemini를 사용)
    const transformedText = this.applyPreviewRules({
      originalText: dto.originalText,
      sentenceEnding: tone.sentenceEnding,
      maxLength: tone.maxLength,
      forbidEmotion: tone.forbidEmotion,
    });

    // 참고: systemPrompt는 최종 변환(create)에서 사용됨. preview에서는 보관만.
    void systemPrompt;
    return { transformedText };
  }

  async create(
    userId: string,
    dto: CreateEmailDto,
  ): Promise<EmailDetailResponseDto> {
    if (!userId) throw new BadRequestException('userId가 필요합니다.');

    const user = await this.usersRepo.findOne({ where: { id: userId } });
    if (!user) throw new NotFoundException('사용자를 찾을 수 없습니다.');

    const tone = await this.getVillagerToneOrThrow(
      dto.villagerId,
      dto.toneType,
    );
    const systemPrompt = this.buildSystemPrompt(tone, tone.villager);

    const toneType = dto.toneType as 'RULE' | 'GPT' | 'HYBRID';

    let transformedText: string;
    if (toneType === 'RULE') {
      transformedText = this.applyPreviewRules({
        originalText: dto.originalText,
        sentenceEnding: tone.sentenceEnding,
        maxLength: tone.maxLength,
        forbidEmotion: tone.forbidEmotion,
      });
    } else {
      try {
        transformedText = await this.geminiService.transformEmail({
          originalText: dto.originalText,
          systemPrompt,
          toneType,
          maxLength: tone.maxLength,
          forbidEmotion: tone.forbidEmotion,
        });
      } catch (error) {
        // 외부 API 장애/쿼터 이슈가 create 자체를 막지 않도록 fallback
        const message = error instanceof Error ? error.message : String(error);
        this.logger.warn(
          `Gemini 변환 실패로 rule fallback 처리합니다. toneType=${toneType} reason=${message}`,
        );
        transformedText = this.applyPreviewRules({
          originalText: dto.originalText,
          sentenceEnding: tone.sentenceEnding,
          maxLength: tone.maxLength,
          forbidEmotion: tone.forbidEmotion,
        });
      }
    }

    if (!transformedText || typeof transformedText !== 'string') {
      throw new BadRequestException('이메일 변환 결과가 올바르지 않습니다.');
    }

    // Option A(MVP): 즉시 전송도 scheduledAt=now로 저장하고 cron이 처리
    // Timezone contract:
    // - 프론트는 scheduledAt을 toISOString() (UTC, Z)로 전송
    // - 백엔드는 Date로 파싱해 그대로 scheduled_at(timestamptz)에 저장
    const scheduledAt = dto.scheduledAt
      ? new Date(dto.scheduledAt)
      : new Date();
    if (dto.scheduledAt && Number.isNaN(scheduledAt.getTime())) {
      throw new BadRequestException('scheduledAt 형식이 올바르지 않습니다.');
    }

    const email = this.emailsRepo.create({
      id: randomUUID(),
      status: 'reserved',
      senderEmail: user.email,
      receiverEmail: dto.receiverEmail,
      subject: dto.subject && dto.subject.length > 0 ? dto.subject : null,
      originalText: dto.originalText,
      transformedText,
      imageUrl: tone.villager.imageUrl,
      scheduledAt,
      user: { id: userId } as Users,
      villager: { id: dto.villagerId } as Villagers,
    });

    await this.emailsRepo.save(email);

    // 집계 트리거: emails 생성(POST /emails) 성공 시점에만 발생
    // preview에는 집계하지 않음
    await this.redisService.incrementVillagerUsage(dto.villagerId);

    const saved = await this.emailsRepo.findOne({
      where: { id: email.id },
      relations: { villager: true, user: true },
    });
    if (!saved)
      throw new NotFoundException('생성된 이메일을 찾을 수 없습니다.');

    if (saved.user?.id !== userId) {
      // 이론상 발생하면 안 되지만 방어적으로 처리
      throw new ForbiddenException('본인의 이메일만 조회할 수 있습니다.');
    }

    return {
      id: saved.id,
      status: saved.status as EmailDetailResponseDto['status'],
      receiverEmail: saved.receiverEmail,
      senderEmail: saved.senderEmail,
      subject: saved.subject ?? dto.subject ?? '',
      originalText: saved.originalText,
      transformedText: saved.transformedText,
      scheduledAt: saved.scheduledAt,
      createdAt: saved.createdAt,
      villagerId: saved.villager?.id ?? dto.villagerId,
      villagerName: saved.villager?.name ?? tone.villager.name,
      villagerImageUrl: saved.villager?.imageUrl ?? tone.villager.imageUrl,
    };
  }

  async findAll(userId: string): Promise<EmailListItemResponseDto[]> {
    if (!userId) throw new BadRequestException('userId가 필요합니다.');

    const emails = await this.emailsRepo.find({
      where: { user: { id: userId } },
      relations: { villager: true },
      order: { createdAt: 'DESC' },
    });

    return emails.map((e) => ({
      id: e.id,
      status: e.status as EmailListItemResponseDto['status'],
      receiverEmail: e.receiverEmail,
      subject: e.subject ?? '',
      originalText: e.originalText,
      scheduledAt: e.scheduledAt,
      createdAt: e.createdAt,
      villagerId: e.villager?.id ?? 0,
      villagerName: e.villager?.name ?? '',
      villagerImageUrl: e.villager?.imageUrl ?? '',
    }));
  }

  async findOne(
    userId: string,
    emailId: string,
  ): Promise<EmailDetailResponseDto> {
    if (!userId) throw new BadRequestException('userId가 필요합니다.');

    const email = await this.emailsRepo.findOne({
      where: { id: emailId },
      relations: { villager: true, user: true },
    });

    if (!email) throw new NotFoundException('이메일을 찾을 수 없습니다.');
    if (email.user?.id !== userId)
      throw new ForbiddenException('본인의 이메일만 조회할 수 있습니다.');

    return {
      id: email.id,
      status: email.status as EmailDetailResponseDto['status'],
      receiverEmail: email.receiverEmail,
      senderEmail: email.senderEmail,
      subject: email.subject ?? '',
      originalText: email.originalText,
      transformedText: email.transformedText,
      scheduledAt: email.scheduledAt,
      createdAt: email.createdAt,
      villagerId: email.villager?.id ?? 0,
      villagerName: email.villager?.name ?? '',
      villagerImageUrl: email.villager?.imageUrl ?? '',
    };
  }

  async remove(userId: string, emailId: string): Promise<{ message: string }> {
    if (!userId) throw new BadRequestException('userId가 필요합니다.');

    const email = await this.emailsRepo.findOne({
      where: { id: emailId },
      relations: { user: true },
    });

    if (!email) throw new NotFoundException('이메일을 찾을 수 없습니다.');
    if (email.user?.id !== userId)
      throw new ForbiddenException('본인의 이메일만 삭제할 수 있습니다.');

    await this.emailsRepo.remove(email);
    return { message: '삭제되었습니다.' };
  }
}
