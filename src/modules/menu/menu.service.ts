import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { CreateMenuItemDto } from 'src/core/dtos/menu/create-menu-item.dto';
import { UpdateMenuItemDto } from 'src/core/dtos/menu/update-menu-item.dto';
import { MenuItemEntity } from 'src/core/entities/menu-item.entity';
import { Repository } from 'typeorm';

@Injectable()
export class MenuService {
    constructor(
        @InjectRepository(MenuItemEntity)
        private readonly menuRepository: Repository<MenuItemEntity>,
    ) {}

    findAll(): Promise<MenuItemEntity[]> {
        return this.menuRepository.find();
    }

    async findOne(id: string): Promise<MenuItemEntity> {
        const item = await this.menuRepository.findOne({ where: { id } });
        if (!item) throw new NotFoundException('Item de menú no encontrado');
        return item;
    }

    async create(dto: CreateMenuItemDto): Promise<MenuItemEntity> {
        const menuItem = this.menuRepository.create({
            name: dto.name,
            description: dto.description,
            price: dto.price,
            isAvailable: dto.isAvailable ?? true,
        });

        return this.menuRepository.save(menuItem);
    }

    async update(id: string, dto: UpdateMenuItemDto): Promise<MenuItemEntity> {
        const item = await this.findOne(id);
        Object.assign(item, dto);
        return this.menuRepository.save(item);
    }

    async remove(id: string): Promise<void> {
        const result = await this.menuRepository.delete(id);
        if (result.affected === 0) { 
            throw new NotFoundException('Item de menú no encontrado');
        }
    }
}
