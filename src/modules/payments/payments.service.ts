import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { CreatePaymentDto } from 'src/core/dtos/payments/create-payment.dto';
import { OrderEntity } from 'src/core/entities/order.entity';
import { PaymentEntity } from 'src/core/entities/payment.entity';
import { TableEntity } from 'src/core/entities/table.entity';
import { UserEntity } from 'src/core/entities/user.entity';
import { OrderStatus } from 'src/core/enums/order-status.enum';
import { TableStatus } from 'src/core/enums/table-status.enum';
import { DataSource, Repository } from 'typeorm';
import { RealtimeGateway } from '../realtime/realtime.gateway';

@Injectable()
export class PaymentsService {
  constructor(
    @InjectRepository(PaymentEntity) private readonly payments: Repository<PaymentEntity>,
    private readonly dataSource: DataSource,
    private readonly realtime: RealtimeGateway,
  ) {}

  findAll() {
    return this.payments.find({ order: { createdAt: 'DESC' } });
  }

  async create(dto: CreatePaymentDto, createdBy?: UserEntity) {
    const payment = await this.dataSource.transaction(async (manager) => {
      const orders = manager.getRepository(OrderEntity);
      const payments = manager.getRepository(PaymentEntity);
      const tables = manager.getRepository(TableEntity);
      const order = await orders.findOne({
        where: { id: dto.orderId },
        lock: { mode: 'pessimistic_write' },
      });
      if (!order) throw new NotFoundException('Orden no encontrada');
      if (order.status === OrderStatus.CANCELLED) throw new BadRequestException('No se puede cobrar una orden cancelada');
      if (order.status === OrderStatus.COMPLETED) throw new ConflictException('La orden ya fue cobrada');
      if (await payments.findOne({ where: { order: { id: order.id } } })) {
        throw new ConflictException('La orden ya tiene un pago registrado');
      }
      const payment = await payments.save(payments.create({
        order,
        createdBy,
        method: dto.method,
        amount: Number(order.total),
      }));
      order.status = OrderStatus.COMPLETED;
      await orders.save(order);
      const table = await tables.findOne({ where: { id: order.table.id } });
      if (table) {
        table.status = TableStatus.FREE;
        await tables.save(table);
      }
      return payment;
    });
    this.realtime.emit('payment.created', payment);
    this.realtime.emit('order.updated', payment.order);
    return payment;
  }
}
