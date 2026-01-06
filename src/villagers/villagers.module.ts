import { Module } from '@nestjs/common';
import { VillagersService } from './villagers.service';
import { VillagersController } from './villagers.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Villagers } from './entities/villager.entity';
import { VillagerTones } from './entities/villagerTones.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Villagers, VillagerTones])],
  controllers: [VillagersController],
  providers: [VillagersService],
})
export class VillagersModule {}
