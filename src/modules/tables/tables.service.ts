import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { CreateTableDto } from 'src/core/dtos/tables/create-table.dto';
import { UpdateTableDto } from 'src/core/dtos/tables/update-table.dto';
import { TableEntity } from 'src/core/entities/table.entity';
import { Repository } from 'typeorm';

@Injectable()
export class TablesService {
    constructor(
        @InjectRepository(TableEntity) private tablesRepo: Repository<TableEntity>
    ) {}

    findAll(): Promise<TableEntity[]> {
        return this.tablesRepo.find();
    }

    async findOne(id: string): Promise<TableEntity>{
        const table = await this.tablesRepo.findOne({ where: { id } });
        if (!table) {
            throw new NotFoundException('Mesa no encontrada');
        }
        return table;
    }

    async create(dto: CreateTableDto): Promise<TableEntity> {
        const exists = await this.tablesRepo.findOne({ where: {number: dto.number } });
        if (exists) {
            throw new ConflictException('Ya existe una mesa con este numero');
        }

        const table = this.tablesRepo.create(dto);
        return this.tablesRepo.save(table);
    }

    async update(id: string, dto: UpdateTableDto): Promise<TableEntity> {
        const table = await this.findOne(id);
        Object.assign(table, dto);
        return this.tablesRepo.save(table);
    }

    async remove(id: string): Promise<void> {
        const result = await this.tablesRepo.delete(id);
        if (result.affected === 0) {
            throw new NotFoundException('Mesa no encontrada para eliminar');
        }
    }
}
