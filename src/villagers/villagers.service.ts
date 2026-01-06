import { Injectable } from '@nestjs/common';
import { CreateVillagerDto } from './dto/create-villager.dto';
import { UpdateVillagerDto } from './dto/update-villager.dto';

@Injectable()
export class VillagersService {
  findAll() {
    return `This action returns all villagers`;
  }

  findOne(id: number) {
    return `This action returns a #${id} villager`;
  }
}
