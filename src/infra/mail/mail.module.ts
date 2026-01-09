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
        if (mode === 'disabled') return disabled;

        // 기본값 정책
        // - 개발/로컬: SMTP 미설정이면 mock로 흘려서 start:dev가 시끄럽지 않게
        // - 운영: SMTP 미설정이면 disabled로 실패시켜 "전송됐다고 착각" 방지
        const nodeEnv = (
          configService.get<string>('NODE_ENV') ?? ''
        ).toLowerCase();
        const isProd = nodeEnv === 'production';

        return isProd ? disabled : mock;
      },
    },
    MailService,
  ],
  exports: [MailService],
})
export class MailModule {}
