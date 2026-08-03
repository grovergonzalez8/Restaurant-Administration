import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { LoginUserDto } from 'src/core/dtos/login/login.dto';
import { UserEntity } from 'src/core/entities/user.entity';
import { comparePassword } from 'src/shared/utils/hash.util';
import { Repository } from 'typeorm';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(UserEntity)
    private usersRepository: Repository<UserEntity>,
    private jwtService: JwtService,
  ) {}

  async validateUser(email: string, password: string) {
    const user = await this.usersRepository.findOne({
      where: { email },
      relations: ['role'],
      select: [
        'id',
        'name',
        'email',
        'passwordHash',
        'phone',
        'createdAt',
        'updatedAt',
      ],
    });

    if (!user) {
      return null;
    }

    const matched = await comparePassword(password, user.passwordHash);
    if (!matched) {
      return null;
    }

    return user;
  }

  async login(dto: LoginUserDto) {
    const user = await this.validateUser(dto.email, dto.password);
    if (!user) {
      throw new UnauthorizedException('Credenciales inválidas.');
    }

    const payload = {
      sub: user.id,
      email: user.email,
      role: user.role.name || 'user',
    };
    return {
      access_token: this.jwtService.sign(payload),
      user,
    };
  }

  async findById(id: string) {
    const user = await this.usersRepository.findOne({
      where: { id },
      relations: ['role'],
    });

    return user;
  }
}
