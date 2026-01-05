import { PartialType } from '@nestjs/swagger';
import { CreateVillagerDto } from './create-villager.dto';

export class UpdateVillagerDto extends PartialType(CreateVillagerDto) {}
