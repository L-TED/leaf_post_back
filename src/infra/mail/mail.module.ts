import { Logger, Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MAIL_SENDER, MailService } from './mail.service';
import { MockMailSender } from './mock-mail.sender';
import { SmtpMailSender } from './smtp-mail.sender';
import { DisabledMailSender } from './disabled-mail.sender';

@Module({
  imports: [ConfigModule],
  providers: [
    Logger,
    SmtpMailSender,
    MockMailSender,
    DisabledMailSender,
    {
      provide: MAIL_SENDER,
      inject: [
        SmtpMailSender,
        MockMailSender,
        DisabledMailSender,
        ConfigService,
      ],
      useFactory: (
        smtp: SmtpMailSender,
        mock: MockMailSender,
        disabled: DisabledMailSender,
        configService: ConfigService,
      ) => {
        if (smtp.isEnabled()) return smtp;

        const modeRaw = configService.get<string>('MAIL_SENDER');
        const mode = (modeRaw ?? '').toLowerCase();
        // 명시적으로 mock를 허용한 경우에만 mock 사용
        if (mode === 'mock') return mock;

        // 기본값: SMTP 미설정이면 실패시키고 EmailSenderJob이 failed로 마킹
        return disabled;
      },
    },
    MailService,
  ],
  exports: [MailService],
})
export class MailModule {}
