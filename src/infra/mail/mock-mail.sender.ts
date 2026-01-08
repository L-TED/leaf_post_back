import { Injectable, Logger } from '@nestjs/common';
import type { MailSender, SendMailInput } from './mail.service';

@Injectable()
export class MockMailSender implements MailSender {
  private readonly logger = new Logger(MockMailSender.name);

  async sendMail(input: SendMailInput): Promise<void> {
    this.logger.warn(
      `[MOCK MAIL] from=${input.from} to=${input.to} subject=${input.subject}\n${input.text}`,
    );
  }
}
