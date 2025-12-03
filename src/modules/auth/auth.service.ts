import { BadRequestException, ConflictException, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { LoginUserDto } from 'src/core/dtos/login/login.dto';
import { CreateUserDto } from 'src/core/dtos/users/create-user.dto';
import { RoleEntity } from 'src/core/entities/role.entity';
import { UserEntity } from 'src/core/entities/user.entity';
import { comparePassword, hashPassword } from 'src/shared/utils/hash.util';
import { Repository } from 'typeorm';

@Injectable()
export class AuthService {
    constructor(
        @InjectRepository(UserEntity)
        private usersRepository: Repository<UserEntity>,
        @InjectRepository(RoleEntity)
        private rolesRepository: Repository<RoleEntity>,
        private jwtService: JwtService,
    ) {}

    async register(dto: CreateUserDto) {
        const existing = await this.usersRepository.findOne({
            where: { email: dto.email },
        });
        if (existing) {
            throw new ConflictException('El correo electrónico ya está en uso.');
        }

        let role: RoleEntity | null = null;
        if (dto.roleId) {
            role = await this.rolesRepository.findOne({
                where: { id: dto.roleId },
            });
            if (!role) {
                throw new BadRequestException(`El rol con id ${dto.roleId} proporcionado no es válido.`);
            }
        } else {
            const roleName = 'waiter';
            role = await this.rolesRepository.findOne({
                where: { name: roleName },
            });
            if (!role) {
                throw new BadRequestException(`El rol por defecto '${roleName}' no está definido en el sistema.`);
            }
        }

        const user = new UserEntity();
        user.name = dto.name;
        user.email = dto.email;
        user.passwordHash = await hashPassword(dto.password);
        user.role = role;

        const saved = await this.usersRepository.save(user);
        return saved;
    }

    async validateUser(email: string, password: string) {
        const user = await this.usersRepository.findOne({ 
            where: { email },
            relations: ['role'], 
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
            role: user.role.name || 'user' 
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
