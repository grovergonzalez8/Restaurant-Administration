import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { CreateTableDto } from 'src/core/dtos/tables/create-table.dto';
import { UpdateTableDto } from 'src/core/dtos/tables/update-table.dto';
import { TableEntity } from 'src/core/entities/table.entity';
import { TableStatus } from 'src/core/enums/table-status.enum';
import { OrderStatus } from 'src/core/enums/order-status.enum';
import { Repository } from 'typeorm';

@Injectable()
export class TablesService {
  constructor(
    @InjectRepository(TableEntity) private tablesRepo: Repository<TableEntity>,
  ) {}

  findAll(): Promise<TableEntity[]> {
    return this.tablesRepo.find();
  }

  findAvailable(): Promise<TableEntity[]> {
    return this.tablesRepo.find({ where: { status: TableStatus.FREE } });
  }

  async findOverview() {
    const activeStatuses = [
      OrderStatus.PENDING,
      OrderStatus.IN_PROGRESS,
      OrderStatus.READY,
    ];
    const tables = await this.tablesRepo
      .createQueryBuilder('table')
      .leftJoinAndSelect(
        'table.orders',
        'order',
        'order.status IN (:...activeStatuses)',
        { activeStatuses },
      )
      .leftJoinAndSelect('order.createdBy', 'createdBy')
      .orderBy('table.number', 'ASC')
      .addOrderBy('order.createdAt', 'DESC')
      .getMany();

    return tables.map((table) => {
      const order = table.orders?.[0];
      return {
        id: table.id,
        number: table.number,
        capacity: table.capacity,
        status: table.status,
        activeOrder: order
          ? {
              id: order.id,
              status: order.status,
              total: Number(order.total),
              createdAt: order.createdAt,
              waiter: order.createdBy
                ? { id: order.createdBy.id, name: order.createdBy.name }
                : null,
            }
          : null,
      };
    });
  }

  async findOne(id: string): Promise<TableEntity> {
    const table = await this.tablesRepo.findOne({ where: { id } });
    if (!table) {
      throw new NotFoundException('Mesa no encontrada');
    }
    return table;
  }

  async create(dto: CreateTableDto): Promise<TableEntity> {
    const exists = await this.tablesRepo.findOne({
      where: { number: dto.number },
    });
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
