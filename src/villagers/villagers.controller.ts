import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { VillagersService } from './villagers.service';
import { CreateVillagerDto } from './dto/create-villager.dto';
import { UpdateVillagerDto } from './dto/update-villager.dto';

@Controller('villagers')
export class VillagersController {
  constructor(private readonly villagersService: VillagersService) {}

  @Post()
  create(@Body() createVillagerDto: CreateVillagerDto) {
    return this.villagersService.create(createVillagerDto);
  }

  @Get()
  findAll() {
    return this.villagersService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.villagersService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateVillagerDto: UpdateVillagerDto) {
    return this.villagersService.update(+id, updateVillagerDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.villagersService.remove(+id);
  }
}
