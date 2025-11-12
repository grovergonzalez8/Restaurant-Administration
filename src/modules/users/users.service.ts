import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { CreateUserDto } from 'src/core/dtos/users/create-user.dto';
import { UpdateUserDto } from 'src/core/dtos/users/update-user.dto';
import { UserEntity } from 'src/core/entities/user.entity';
import { hashPassword } from 'src/shared/utils/hash.util';
import { Repository } from 'typeorm';

@Injectable()
export class UsersService {
    constructor(
        @InjectRepository(UserEntity)
        private usersRepository: Repository<UserEntity>,
    ) {}

    findAll(): Promise<UserEntity[]> {
        return this.usersRepository.find();
    }

    async findOne(id: string): Promise<UserEntity> {
        const user = await this.usersRepository.findOne({ where: { id } });
        if (!user) {
            throw new NotFoundException('Usuario no encontrado');
        } 
        return user;
    }

    async create(dto: CreateUserDto): Promise<UserEntity> {
        const existing = await this.usersRepository.findOne({ where: { email: dto.email } });
        if (existing) {
            throw new ConflictException('Email ya registrado');
        }
        const passwordHash = await hashPassword(dto.password);
        const user = this.usersRepository.create({ 
            email: dto.email,
            name: dto.name,
            role: dto.role,
            passwordHash
         });

        return this.usersRepository.save(user);
    }

    async update(id: string, dto: UpdateUserDto): Promise<UserEntity> {
        const user = await this.findOne(id);

        if (dto.password) {
            dto.password = await hashPassword(dto.password);
            delete dto.password;
        }

        Object.assign(user, dto);
        return this.usersRepository.save(user);
    }

    async remove(id: string): Promise<void> {
        const result = await this.usersRepository.delete(id);
        if (result.affected === 0) throw new NotFoundException('Usuario no encontrado');
    }
}
