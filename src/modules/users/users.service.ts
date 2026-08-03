import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { CreateUserDto } from 'src/core/dtos/users/create-user.dto';
import { UpdateUserDto } from 'src/core/dtos/users/update-user.dto';
import { RoleEntity } from 'src/core/entities/role.entity';
import { UserEntity } from 'src/core/entities/user.entity';
import { hashPassword } from 'src/shared/utils/hash.util';
import { Repository } from 'typeorm';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(UserEntity)
    private usersRepository: Repository<UserEntity>,
    @InjectRepository(RoleEntity)
    private rolesRepository: Repository<RoleEntity>,
  ) {}

  findAll(): Promise<UserEntity[]> {
    return this.usersRepository.find({ relations: ['role'] });
  }

  async findOne(id: string): Promise<UserEntity> {
    const user = await this.usersRepository.findOne({
      where: { id },
      relations: ['role'],
    });
    if (!user) {
      throw new NotFoundException('Usuario no encontrado');
    }
    return user;
  }

  async findByEmail(email: string): Promise<UserEntity> {
    const user = await this.usersRepository.findOne({
      where: { email },
      relations: ['role'],
    });
    if (!user) {
      throw new NotFoundException(`Usuario con email: ${email} no encontrado`);
    }
    return user;
  }

  async create(dto: CreateUserDto): Promise<UserEntity> {
    const email = dto.email.trim().toLowerCase();
    const existing = await this.usersRepository.findOne({ where: { email } });
    if (existing) {
      throw new ConflictException('Email ya registrado');
    }

    let role: RoleEntity | null = null;
    if (dto.roleId) {
      role = await this.rolesRepository.findOne({ where: { id: dto.roleId } });
      if (!role) {
        throw new NotFoundException(`Rol con id ${dto.roleId} no encontrado`);
      }
    } else {
      role = await this.rolesRepository.findOne({ where: { name: 'waiter' } });
      if (!role) {
        throw new NotFoundException('Rol por defecto "waiter" no encontrado');
      }
    }

    const passwordHash = await hashPassword(dto.password);
    const user = new UserEntity();
    user.email = email;
    user.passwordHash = passwordHash;
    user.name = dto.name.trim();
    user.isActive = true;
    if (dto.phone !== undefined) {
      user.phone = dto.phone;
    }
    user.role = role;

    const saved = await this.usersRepository.save(user);
    return saved;
  }

  async update(
    id: string,
    dto: UpdateUserDto,
    actorId?: string,
  ): Promise<UserEntity> {
    const user = await this.findOne(id);

    if (actorId === id && dto.isActive === false) {
      throw new ConflictException('No puedes desactivar tu propia cuenta');
    }

    if (dto.password) {
      user.passwordHash = await hashPassword(dto.password);
    }

    if (dto.roleId !== undefined) {
      const role = await this.rolesRepository.findOne({
        where: { id: dto.roleId },
      });
      if (!role) {
        throw new NotFoundException(`Rol con id ${dto.roleId} no encontrado`);
      }
      if (actorId === id && role.name !== 'admin') {
        throw new ConflictException(
          'No puedes quitar tu propio rol administrador',
        );
      }
      user.role = role;
    }

    if (dto.name) {
      user.name = dto.name.trim();
    }

    if (dto.email) {
      const email = dto.email.trim().toLowerCase();
      const existing = await this.usersRepository.findOne({ where: { email } });
      if (existing && existing.id !== id) {
        throw new ConflictException('Email ya registrado');
      }
      user.email = email;
    }

    if (dto.phone !== undefined) {
      user.phone = dto.phone;
    }

    if (dto.isActive !== undefined) {
      user.isActive = dto.isActive;
    }

    const saved = await this.usersRepository.save(user);
    return saved;
  }

  async remove(id: string, actorId?: string): Promise<void> {
    if (actorId === id) {
      throw new ConflictException('No puedes eliminar tu propia cuenta');
    }
    const result = await this.usersRepository.delete(id);
    if (result.affected === 0)
      throw new NotFoundException('Usuario no encontrado');
  }
}
