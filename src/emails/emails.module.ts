import { Module } from '@nestjs/common';
import { EmailsService } from './emails.service';
import { EmailsController } from './emails.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Emails } from './entities/email.entity';
import { Villagers } from 'src/villagers/entities/villager.entity';
import { Users } from 'src/users/entities/user.entity';
import { VillagerTones } from './entities/villager-tones.entity';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AuthGuard } from 'common/guard/auth-guard.guard';
import { GeminiModule } from 'src/infra/gemini/gemini.module';
import { MailModule } from 'src/infra/mail/mail.module';
import { EmailSenderJob } from './jobs/email-sender.job';

@Module({
  imports: [
    TypeOrmModule.forFeature([Emails, Users, Villagers, VillagerTones]),
    JwtModule.registerAsync({
      useFactory: (configService: ConfigService) => ({
        secret: configService.get('TOKEN_SECRET'),
      }),
      inject: [ConfigService],
      imports: [ConfigModule],
    }),
    GeminiModule,
    MailModule,
  ],
  controllers: [EmailsController],
  providers: [EmailsService, AuthGuard, EmailSenderJob],
})
export class EmailsModule {}
