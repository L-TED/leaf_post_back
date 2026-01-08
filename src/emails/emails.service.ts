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

@Injectable()
export class EmailsService {
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
  ) {}

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

    const toneType = dto.toneType as 'RULE' | 'GPT' | 'HYBRID';

    const transformedText = await this.geminiService.transformEmail({
      originalText: dto.originalText,
      systemPrompt,
      toneType,
      maxLength: tone.maxLength,
      forbidEmotion: tone.forbidEmotion,
    });

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
    try {
      transformedText = await this.geminiService.transformEmail({
        originalText: dto.originalText,
        systemPrompt,
        toneType,
        maxLength: tone.maxLength,
        forbidEmotion: tone.forbidEmotion,
      });
    } catch {
      throw new BadRequestException('이메일 변환에 실패했습니다.');
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
      subject: dto.subject,
      originalText: dto.originalText,
      transformedText,
      imageUrl: tone.villager.imageUrl,
      scheduledAt,
      user: { id: userId } as Users,
      villager: { id: dto.villagerId } as Villagers,
    });

    await this.emailsRepo.save(email);

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
      subject: saved.subject ?? dto.subject,
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
