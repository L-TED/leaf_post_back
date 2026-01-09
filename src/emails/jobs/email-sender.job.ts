import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Emails } from '../entities/email.entity';

@Injectable()
export class EmailSenderJob {
  private readonly logger = new Logger(EmailSenderJob.name);

  constructor(
    @InjectRepository(Emails)
    private readonly emailsRepo: Repository<Emails>,
  ) {}

  // 매 1분마다 due 예약메일 발송 처리
  @Cron('* * * * *')
  async handleCron(): Promise<void> {
    // Timezone contract:
    // - scheduledAt은 timestamptz로 저장됨(프론트는 toISOString() UTC(Z) 전송)
    // - due 판단은 DB now() 기준으로 비교한다.
    const dueEmails = await this.emailsRepo
      .createQueryBuilder('e')
      .where('e.status = :status', { status: 'reserved' })
      .andWhere('e.scheduledAt IS NOT NULL')
      .andWhere('e.scheduledAt <= now()')
      .orderBy('e.scheduledAt', 'ASC')
      .limit(20)
      .getMany();

    if (dueEmails.length === 0) return;

    const ids = dueEmails.map((e) => e.id);
    const result = await this.emailsRepo
      .createQueryBuilder()
      .update(Emails)
      .set({ status: 'sent' })
      .where('id IN (:...ids)', { ids })
      .andWhere('status = :status', { status: 'reserved' })
      .execute();

    const affected = result.affected ?? 0;
    const sample = ids.slice(0, 5).join(',');
    this.logger.log(
      `Marked emails as sent (no-op delivery). count=${affected}, sampleIds=[${sample}]`,
    );
  }
}
