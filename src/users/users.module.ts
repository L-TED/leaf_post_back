import { Module } from '@nestjs/common';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Users } from './entities/user.entity';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AuthGuard } from 'common/guard/auth-guard.guard';

@Module({
  imports: [
    TypeOrmModule.forFeature([Users]),
    JwtModule.registerAsync({
      useFactory: (configService: ConfigService) => ({
        secret: configService.get('TOKEN_SECRET'),
      }),
      inject: [ConfigService],
      imports: [ConfigModule],
    }),
  ],
  controllers: [UsersController],
  providers: [UsersService, AuthGuard],
})
export class UsersModule {}
