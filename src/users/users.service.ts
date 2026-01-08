import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateNicknameDto } from './dto/update-nickname.dto';
import { Users } from './entities/user.entity';
import { randomUUID } from 'crypto';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';
import { SupabaseService } from 'src/provider/supabase.service';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(Users)
    private readonly usersRepo: Repository<Users>,
    private readonly jwtService: JwtService,
    private readonly supabaseService: SupabaseService,
  ) {}

  decodeAccessToken(token: string): { sub?: string } | null {
    const payload = this.jwtService.decode(token);
    if (!payload || typeof payload !== 'object') return null;

    const maybeSub = (payload as { sub?: unknown }).sub;
    return typeof maybeSub === 'string' ? { sub: maybeSub } : null;
  }

  async create(createUserDto: CreateUserDto, file?: Express.Multer.File) {
    const exists = await this.usersRepo.findOne({
      where: { email: createUserDto.email },
    });
    if (exists) throw new ConflictException('이미 사용 중인 이메일입니다.');

    const profileImage = file
      ? await this.supabaseService.uploadProfileImage(file)
      : null;

    const hashedPassword = await bcrypt.hash(createUserDto.password, 10);
    const user = this.usersRepo.create({
      id: randomUUID(),
      email: createUserDto.email,
      password: hashedPassword,
      nickname: createUserDto.nickname,
      profileImage,
    });
    const saved = await this.usersRepo.save(user);
    return {
      id: saved.id,
      email: saved.email,
      nickname: saved.nickname,
      profileImage: saved.profileImage,
      createdAt: saved.createdAt,
    };
  }

  async findOne(id: string) {
    const user = await this.usersRepo.findOne({ where: { id } });
    if (!user) throw new NotFoundException('사용자를 찾을 수 없습니다.');
    return {
      id: user.id,
      email: user.email,
      nickname: user.nickname,
      profileImage: user.profileImage,
      createdAt: user.createdAt,
    };
  }

  async updateNickname(id: string, dto: UpdateNicknameDto) {
    const user = await this.usersRepo.findOne({ where: { id } });
    if (!user) throw new NotFoundException('사용자를 찾을 수 없습니다.');

    user.nickname = dto.nickname;
    await this.usersRepo.save(user);
    return {
      id: user.id,
      email: user.email,
      nickname: user.nickname,
      profileImage: user.profileImage,
      createdAt: user.createdAt,
    };
  }

  async updateProfile(id: string, file: Express.Multer.File) {
    const user = await this.usersRepo.findOne({ where: { id } });
    if (!user) throw new NotFoundException('사용자를 찾을 수 없습니다.');

    const nextProfileImage =
      await this.supabaseService.uploadProfileImage(file);
    user.profileImage = nextProfileImage;
    await this.usersRepo.save(user);

    return {
      id: user.id,
      email: user.email,
      nickname: user.nickname,
      profileImage: user.profileImage,
      createdAt: user.createdAt,
    };
  }

  async remove(id: string) {
    const result = await this.usersRepo.delete({ id });
    if (!result.affected)
      throw new NotFoundException('사용자를 찾을 수 없습니다.');
    return { message: '사용자가 삭제되었습니다.' };
  }
}
