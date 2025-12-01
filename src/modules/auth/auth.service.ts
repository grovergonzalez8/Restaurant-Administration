import { ConflictException, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { LoginUserDto } from 'src/core/dtos/login/login.dto';
import { CreateUserDto } from 'src/core/dtos/users/create-user.dto';
import { UserEntity } from 'src/core/entities/user.entity';
import { comparePassword, hashPassword } from 'src/shared/utils/hash.util';
import { Repository } from 'typeorm';

@Injectable()
export class AuthService {
    constructor(
        @InjectRepository(UserEntity)
        private usersRepository: Repository<UserEntity>,
        private jwtService: JwtService,
    ) {}

    async register(dto: CreateUserDto) {
        const existing = await this.usersRepository.findOne({ where: { email: dto.email } });

        if (existing) {
            throw new ConflictException('Usuario ya registrado con este correo electrónico.');
        }

        const user = this.usersRepository.create(dto);
        user.passwordHash = await hashPassword(dto.password);

        if (!user.role) {
            user.role = dto.role || 'waiter';
        }

        const saved = await this.usersRepository.save(user);
        return saved;
    }

    async validateUser(email: string, password: string) {
        const user = await this.usersRepository.findOne({ where: { email } });
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

        const payload = { sub: user.id, email: user.email, role: user.role };
        return {
            access_token: this.jwtService.sign(payload),
            user,
        };
    }

    async findById(id: string) {
        const user = await this.usersRepository.findOne({ where: { id } });
        return user;
    }
}
