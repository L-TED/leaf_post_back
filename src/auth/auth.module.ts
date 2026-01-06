import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RefreshTokens } from './entities/refreshToken.entity';
import { Users } from 'src/users/entities/user.entity';
import { Emails } from 'src/emails/entities/email.entity';

@Module({
  imports: [TypeOrmModule.forFeature([RefreshTokens, Users, Emails])],
  controllers: [AuthController],
  providers: [AuthService],
})
export class AuthModule {}
