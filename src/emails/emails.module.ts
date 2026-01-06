import { Module } from '@nestjs/common';
import { EmailsService } from './emails.service';
import { EmailsController } from './emails.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Emails } from './entities/email.entity';
import { Villagers } from 'src/villagers/entities/villager.entity';
import { Users } from 'src/users/entities/user.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Emails, Users, Villagers])],
  controllers: [EmailsController],
  providers: [EmailsService],
})
export class EmailsModule {}
