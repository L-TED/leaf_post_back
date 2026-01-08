import { Inject, Injectable, Logger } from '@nestjs/common';

export type SendMailInput = {
  from: string;
  to: string;
  subject: string;
  text: string;
};

export interface MailSender {
  sendMail(input: SendMailInput): Promise<void>;
}

export const MAIL_SENDER = 'MAIL_SENDER';

@Injectable()
export class MailService {
  constructor(
    @Inject(MAIL_SENDER) private readonly sender: MailSender,
    private readonly logger: Logger,
  ) {}

  async sendMail(input: SendMailInput): Promise<void> {
    await this.sender.sendMail(input);
    this.logger.log(`Mail sent: to=${input.to} subject=${input.subject}`);
  }
}
