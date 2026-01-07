import { Injectable } from '@nestjs/common';

@Injectable()
export class VillagersService {
  findAll() {
    return `This action returns all villagers`;
  }

  findOne(id: number) {
    return `This action returns a #${id} villager`;
  }
}
