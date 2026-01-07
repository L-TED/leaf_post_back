import { Controller, Get, Post, Param } from '@nestjs/common';
import { VillagersService } from './villagers.service';

@Controller('villagers')
export class VillagersController {
  constructor(private readonly villagersService: VillagersService) {}

  @Get()
  findAll() {
    return this.villagersService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.villagersService.findOne(+id);
  }
}
