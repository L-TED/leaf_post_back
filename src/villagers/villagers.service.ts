import { Injectable } from '@nestjs/common';
import { CreateVillagerDto } from './dto/create-villager.dto';
import { UpdateVillagerDto } from './dto/update-villager.dto';

@Injectable()
export class VillagersService {
  create(createVillagerDto: CreateVillagerDto) {
    return 'This action adds a new villager';
  }

  findAll() {
    return `This action returns all villagers`;
  }

  findOne(id: number) {
    return `This action returns a #${id} villager`;
  }

  update(id: number, updateVillagerDto: UpdateVillagerDto) {
    return `This action updates a #${id} villager`;
  }

  remove(id: number) {
    return `This action removes a #${id} villager`;
  }
}
