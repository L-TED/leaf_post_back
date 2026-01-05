import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UsersModule } from './users/users.module';
import { AuthModule } from './auth/auth.module';
import { VillagersModule } from './villagers/villagers.module';
import { EmailsModule } from './emails/emails.module';

@Module({
  imports: [UsersModule, AuthModule, VillagersModule, EmailsModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
