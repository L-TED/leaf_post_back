import { Injectable, Logger } from '@nestjs/common';
import type { MailSender, SendMailInput } from './mail.service';

@Injectable()
export class DisabledMailSender implements MailSender {
  private readonly logger = new Logger(DisabledMailSender.name);

  async sendMail(_input: SendMailInput): Promise<void> {
    this.logger.error('Mail sending is disabled (SMTP not configured).');
    throw new Error('SMTP is not configured');
  }
}
