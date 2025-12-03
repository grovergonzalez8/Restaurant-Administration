import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { CreateRoleDto } from 'src/core/dtos/roles/create-role.dto';
import { UpdateRoleDto } from 'src/core/dtos/roles/update-role.dto';
import { RoleEntity } from 'src/core/entities/role.entity';
import { Repository } from 'typeorm';

@Injectable()
export class RolesService {
    constructor(
        @InjectRepository(RoleEntity)
        private readonly rolesRepository: Repository<RoleEntity>
    ) {}

    findAll() {
        return this.rolesRepository.find();
    }

    async findOne(id: number) {
        const role = await this.rolesRepository.findOne({ where: { id } });
        if (!role) {
            throw new NotFoundException('Rol no encontrado');
        }
        return role;
    }

    async findByName(name: string) {
        return this.rolesRepository.findOne({ where: { name } });
    }

    async create(dto: CreateRoleDto) {
        const existing = await this.rolesRepository.findOne({ where: { name: dto.name } });
        if (existing) {
            throw new ConflictException('El rol ya existe');
        }

        const role = this.rolesRepository.create(dto);
        return this.rolesRepository.save(role);
    }

    async update(id: number, dto: UpdateRoleDto) {
        const role = await this.findOne(id);
        Object.assign(role, dto);
        return this.rolesRepository.save(role);
    }

    async remove(id: number) {
        const role = await this.findOne(id);
        return this.rolesRepository.remove(role);
    }
}
