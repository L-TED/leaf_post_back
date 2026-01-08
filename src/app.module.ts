import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UsersModule } from './users/users.module';
import { VillagersModule } from './villagers/villagers.module';
import { EmailsModule } from './emails/emails.module';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from './auth/auth.module';
import { ScheduleModule } from '@nestjs/schedule';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    ScheduleModule.forRoot(),
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const dbSslRaw = String(configService.get<string>('DB_SSL') ?? '');
        const sslEnabled =
          dbSslRaw.toLowerCase() === 'true' || dbSslRaw === '1';

        const dbSslRejectUnauthorizedRaw = String(
          configService.get<string>('DB_SSL_REJECT_UNAUTHORIZED') ?? 'true',
        );
        const rejectUnauthorized =
          dbSslRejectUnauthorizedRaw.toLowerCase() === 'true' ||
          dbSslRejectUnauthorizedRaw === '1';

        return {
          type: 'postgres',
          host: configService.get<string>('DB_HOST'),
          port: Number(configService.get<string>('DB_PORT') ?? 5432),
          username: configService.get<string>('DB_USERNAME'),
          password: configService.get<string>('DB_PASSWORD'),
          database: configService.get<string>('DB_DATABASE'),
          ssl: sslEnabled ? { rejectUnauthorized } : undefined,
          autoLoadEntities: true,
          synchronize: false,
        };
      },
    }),
    UsersModule,
    AuthModule,
    VillagersModule,
    EmailsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
