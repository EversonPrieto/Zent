import {
  ConflictException,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateUserDto } from './dto/create-user.dto';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AuthService {
  constructor(private prisma: PrismaService) {}

  async signUp(dto: CreateUserDto) {
    const salt = 10;
    const hashedPassword = await bcrypt.hash(dto.password, salt);

    try {
      const user = await this.prisma.user.create({
        data: {
          name: dto.name,
          email: dto.email,
          password: hashedPassword,
        },
      });
      const { password, ...result } = user;
      return result;
    } catch (error) {
      if (error.code === 'P2002') {
        throw new ConflictException('Este email já está em uso.');
      }
      throw new InternalServerErrorException();
    }
  }
}