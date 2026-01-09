import { Module } from '@nestjs/common';
import { VillagersService } from './villagers.service';
import { VillagersController } from './villagers.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Villagers } from './entities/villager.entity';
import { VillagerTones } from '../emails/entities/villager-tones.entity';
import { RedisModule } from 'src/infra/redis/redis.module';

@Module({
  imports: [TypeOrmModule.forFeature([Villagers, VillagerTones]), RedisModule],
  controllers: [VillagersController],
  providers: [VillagersService],
})
export class VillagersModule {}
