import { Controller, Get, Param, ParseIntPipe, Query } from '@nestjs/common';
import { VillagersService } from './villagers.service';
import { VillagerPreviewDTO } from './dto/villager-preview.response.dto';

@Controller('villagers')
export class VillagersController {
  constructor(private readonly villagersService: VillagersService) {}

  @Get()
  async findAll(
    @Query('sort') sort?: string,
    @Query('limit') limit?: string,
  ): Promise<VillagerPreviewDTO[]> {
    if (sort === 'popular') {
      const parsedLimit = limit ? Number.parseInt(limit, 10) : undefined;
      return this.villagersService.findPopular(parsedLimit);
    }

    return this.villagersService.findAll();
  }

  @Get(':id')
  async findOne(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<VillagerPreviewDTO> {
    return this.villagersService.findOne(id);
  }
}
