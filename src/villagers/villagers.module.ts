import { Module } from '@nestjs/common';
import { VillagersService } from './villagers.service';
import { VillagersController } from './villagers.controller';

@Module({
  controllers: [VillagersController],
  providers: [VillagersService],
})
export class VillagersModule {}
