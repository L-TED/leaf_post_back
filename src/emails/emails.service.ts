import { Injectable } from '@nestjs/common';
import { CreateEmailDto } from './requestDto/create-email-request.dto';

@Injectable()
export class EmailsService {
  create(createEmailDto: CreateEmailDto) {
    return 'This action adds a new email';
  }

  findAll() {
    return `This action returns all emails`;
  }

  findOne(id: number) {
    return `This action returns a #${id} email`;
  }

  remove(id: number) {
    return `This action removes a #${id} email`;
  }
}
