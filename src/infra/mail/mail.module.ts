import { Logger, Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { MAIL_SENDER, MailService } from './mail.service';
import { MockMailSender } from './mock-mail.sender';
import { SmtpMailSender } from './smtp-mail.sender';

@Module({
  imports: [ConfigModule],
  providers: [
    Logger,
    SmtpMailSender,
    MockMailSender,
    {
      provide: MAIL_SENDER,
      inject: [SmtpMailSender, MockMailSender],
      useFactory: (smtp: SmtpMailSender, mock: MockMailSender) => {
        return smtp.isEnabled() ? smtp : mock;
      },
    },
    MailService,
  ],
  exports: [MailService],
})
export class MailModule {}
