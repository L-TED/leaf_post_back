import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Emails } from '../entities/email.entity';
import { MailService } from 'src/infra/mail/mail.service';

@Injectable()
export class EmailSenderJob {
  private readonly logger = new Logger(EmailSenderJob.name);

  constructor(
    @InjectRepository(Emails)
    private readonly emailsRepo: Repository<Emails>,
    private readonly mailService: MailService,
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

    this.logger.log(`Due emails: ${dueEmails.length}`);

    for (const email of dueEmails) {
      try {
        await this.mailService.sendMail({
          from: email.senderEmail,
          to: email.receiverEmail,
          subject: email.subject ?? '',
          text: email.transformedText,
        });

        // canceled는 건드리지 않기 위해 status 조건을 같이 둔다.
        const result = await this.emailsRepo.update(
          { id: email.id, status: 'reserved' },
          { status: 'sent' },
        );

        if (!result.affected) {
          this.logger.warn(
            `Skip status update (not reserved anymore): emailId=${email.id}`,
          );
        }
      } catch (err) {
        this.logger.error(
          `Send failed: emailId=${email.id} to=${email.receiverEmail}`,
          err instanceof Error ? err.stack : undefined,
        );

        await this.emailsRepo.update(
          { id: email.id, status: 'reserved' },
          { status: 'failed' },
        );

        // TODO: 스키마 변경 없이 MVP에서는 1회 시도 후 failed 처리.
        //       추후 retryCount 컬럼(또는 별도 테이블/Redis) 기반 재시도 확장 가능.
      }
    }
  }
}
