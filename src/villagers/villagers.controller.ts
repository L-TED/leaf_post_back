import { Controller, Get, Post, Param, ParseIntPipe } from '@nestjs/common';
import { VillagersService } from './villagers.service';
import { VillagerPreviewDTO } from './dto/villager-preview.response.dto';

@Controller('villagers')
export class VillagersController {
  constructor(private readonly villagersService: VillagersService) {}

  @Get()
  async findAll(): Promise<VillagerPreviewDTO[]> {
    return this.villagersService.findAll();
  }

  @Get(':id')
  async findOne(@Param('id', ParseIntPipe) id: number) {
    return this.villagersService.findOne(id);
  }
}
