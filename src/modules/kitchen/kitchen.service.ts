import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { CreateKitchenOrderDto } from 'src/core/dtos/kitchen/create-kitchen-order.dto';
import { UpdateKitchenStatusDto } from 'src/core/dtos/kitchen/update-kitchen-order.dto';
import { KitchenOrderEntity } from 'src/core/entities/kitchen-order.entity';
import { OrderEntity } from 'src/core/entities/order.entity';
import { KitchenStatus } from 'src/core/enums/kitchen-status.enum';
import { Repository } from 'typeorm';
import { RealtimeGateway } from '../realtime/realtime.gateway';
import { OrdersService } from '../orders/orders.service';
import { OrderStatus } from 'src/core/enums/order-status.enum';

@Injectable()
export class KitchenService {
  constructor(
    @InjectRepository(KitchenOrderEntity)
    private readonly kitchenRepository: Repository<KitchenOrderEntity>,
    @InjectRepository(OrderEntity)
    private readonly orderRepository: Repository<OrderEntity>,
    private readonly realtime: RealtimeGateway,
    private readonly ordersService: OrdersService,
  ) {}

  async create(dto: CreateKitchenOrderDto): Promise<KitchenOrderEntity> {
    const order = await this.orderRepository.findOne({
      where: { id: dto.orderID },
    });
    if (!order) throw new NotFoundException('Pedido no encontrado');
    const existing = await this.kitchenRepository.findOne({
      where: { order: { id: order.id } },
    });
    if (existing)
      throw new ConflictException('El pedido ya tiene una orden de cocina');

    const kitchenOrder = this.kitchenRepository.create({
      order,
      status: KitchenStatus.PENDING,
    });

    const saved = await this.kitchenRepository.save(kitchenOrder);
    this.realtime.emit('kitchen.created', saved);
    return saved;
  }

  findAll(): Promise<KitchenOrderEntity[]> {
    return this.kitchenRepository.find();
  }

  findActive(): Promise<KitchenOrderEntity[]> {
    return this.kitchenRepository.find({
      where: [
        { status: KitchenStatus.PENDING },
        { status: KitchenStatus.IN_PROGRESS },
      ],
      order: { createdAt: 'ASC' },
    });
  }

  async findOne(id: string): Promise<KitchenOrderEntity> {
    const kitchenOrder = await this.kitchenRepository.findOne({
      where: { id },
    });
    if (!kitchenOrder)
      throw new NotFoundException('Pedido de cocina no encontrado');
    return kitchenOrder;
  }

  async updateStatus(
    id: string,
    dto: UpdateKitchenStatusDto,
  ): Promise<KitchenOrderEntity> {
    const kitchenOrder = await this.findOne(id);
    const transitions: Record<KitchenStatus, KitchenStatus[]> = {
      [KitchenStatus.PENDING]: [
        KitchenStatus.IN_PROGRESS,
        KitchenStatus.CANCELLED,
      ],
      [KitchenStatus.IN_PROGRESS]: [
        KitchenStatus.READY,
        KitchenStatus.CANCELLED,
      ],
      [KitchenStatus.READY]: [],
      [KitchenStatus.CANCELLED]: [],
    };
    if (
      dto.status !== kitchenOrder.status &&
      !transitions[kitchenOrder.status].includes(dto.status)
    ) {
      throw new ConflictException('Transición de cocina no válida');
    }
    if (dto.status === KitchenStatus.IN_PROGRESS) {
      await this.ordersService.update(kitchenOrder.order.id, {
        status: OrderStatus.IN_PROGRESS,
      });
    }
    if (dto.status === KitchenStatus.CANCELLED) {
      await this.ordersService.update(kitchenOrder.order.id, {
        status: OrderStatus.CANCELLED,
      });
    }
    kitchenOrder.status = dto.status;
    const saved = await this.kitchenRepository.save(kitchenOrder);
    this.realtime.emit('kitchen.updated', saved);
    return saved;
  }

  async remove(id: string): Promise<void> {
    const result = await this.kitchenRepository.delete(id);
    if (result.affected === 0)
      throw new NotFoundException('Pedido de cocina no encontrado');
  }
}
