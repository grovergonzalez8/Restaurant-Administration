import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
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
import { CashSessionEntity } from 'src/core/entities/cash-session.entity';
import { CashSessionStatus } from 'src/core/enums/cash-session-status.enum';
import { KitchenOrderEntity } from 'src/core/entities/kitchen-order.entity';
import { KitchenStatus } from 'src/core/enums/kitchen-status.enum';
import { PaymentMethod } from 'src/core/enums/payment-method.enum';
import { PaymentCheckoutState } from 'src/core/enums/payment-checkout-state.enum';

@Injectable()
export class PaymentsService {
  constructor(
    @InjectRepository(PaymentEntity)
    private readonly payments: Repository<PaymentEntity>,
    @InjectRepository(OrderEntity)
    private readonly orders: Repository<OrderEntity>,
    @InjectRepository(KitchenOrderEntity)
    private readonly kitchenOrders: Repository<KitchenOrderEntity>,
    @InjectRepository(CashSessionEntity)
    private readonly sessions: Repository<CashSessionEntity>,
    private readonly dataSource: DataSource,
    private readonly realtime: RealtimeGateway,
  ) {}

  findAll() {
    return this.payments.find({ order: { createdAt: 'DESC' } });
  }

  private assertOrderAccess(order: OrderEntity, actor: UserEntity) {
    if (actor.role?.name !== 'admin' && order.createdBy?.id !== actor.id) {
      throw new ForbiddenException('No puedes cobrar esta orden');
    }
  }

  private cashAmounts(dto: CreatePaymentDto, total: number) {
    if (dto.method !== PaymentMethod.CASH) {
      return { receivedAmount: null, changeAmount: null };
    }
    const received = Number(dto.receivedAmount);
    if (!Number.isFinite(received)) {
      throw new BadRequestException('Debes ingresar el efectivo recibido');
    }
    const totalInCents = Math.round(total * 100);
    const receivedInCents = Math.round(received * 100);
    if (receivedInCents < totalInCents) {
      throw new BadRequestException(
        'El efectivo recibido no cubre el total de la orden',
      );
    }
    return {
      receivedAmount: receivedInCents / 100,
      changeAmount: (receivedInCents - totalInCents) / 100,
    };
  }

  async checkout(orderId: string, actor: UserEntity) {
    const order = await this.orders.findOne({
      where: { id: orderId },
      relations: { table: true, createdBy: true },
      loadEagerRelations: false,
    });
    if (!order) throw new NotFoundException('Orden no encontrada');
    this.assertOrderAccess(order, actor);
    const [kitchenOrder, payment, session] = await Promise.all([
      this.kitchenOrders.findOne({
        where: { order: { id: order.id } },
        loadEagerRelations: false,
      }),
      this.payments.findOne({ where: { order: { id: order.id } } }),
      this.sessions.findOne({
        where: {
          openedBy: { id: actor.id },
          status: CashSessionStatus.OPEN,
        },
      }),
    ]);
    let state: PaymentCheckoutState;
    let message: string;
    if (payment || order.status === OrderStatus.COMPLETED) {
      state = PaymentCheckoutState.PAID;
      message = 'La orden ya fue cobrada';
    } else if (order.status === OrderStatus.CANCELLED) {
      state = PaymentCheckoutState.CANCELLED;
      message = 'La orden está cancelada';
    } else if (
      order.status !== OrderStatus.READY ||
      kitchenOrder?.status !== KitchenStatus.READY
    ) {
      state = PaymentCheckoutState.WAITING_KITCHEN;
      message = 'Espera a que cocina marque la orden como lista';
    } else if (!session) {
      state = PaymentCheckoutState.OPEN_CASH_SESSION;
      message = 'Abre tu caja para registrar el pago';
    } else {
      state = PaymentCheckoutState.READY_TO_PAY;
      message = 'Selecciona el método cuando el cliente realice el pago';
    }
    return {
      orderId: order.id,
      orderStatus: order.status,
      kitchenStatus: kitchenOrder?.status ?? null,
      tableNumber: order.table.number,
      total: Number(order.total),
      state,
      message,
      canPay: state === PaymentCheckoutState.READY_TO_PAY,
      methods:
        state === PaymentCheckoutState.READY_TO_PAY
          ? Object.values(PaymentMethod)
          : [],
      cashSession: session
        ? {
            id: session.id,
            openedAt: session.openedAt,
            openingBalance: Number(session.openingBalance),
          }
        : null,
      payment: payment
        ? {
            id: payment.id,
            method: payment.method,
            amount: Number(payment.amount),
            receivedAmount:
              payment.receivedAmount == null
                ? null
                : Number(payment.receivedAmount),
            changeAmount:
              payment.changeAmount == null
                ? null
                : Number(payment.changeAmount),
            createdAt: payment.createdAt,
          }
        : null,
    };
  }

  async findReceipt(orderId: string, actor: UserEntity) {
    const payment = await this.payments.findOne({
      where: { order: { id: orderId } },
      relations: {
        order: {
          table: true,
          createdBy: true,
          items: { menuItem: true },
        },
        createdBy: true,
        cashSession: true,
      },
      loadEagerRelations: false,
    });
    if (!payment) throw new NotFoundException('Pago no encontrado');
    if (
      actor.role?.name !== 'admin' &&
      payment.createdBy?.id !== actor.id &&
      payment.order.createdBy?.id !== actor.id
    ) {
      throw new ForbiddenException('No puedes consultar este comprobante');
    }
    return {
      receiptNumber: payment.id,
      issuedAt: payment.createdAt,
      method: payment.method,
      amount: Number(payment.amount),
      receivedAmount:
        payment.receivedAmount == null ? null : Number(payment.receivedAmount),
      changeAmount:
        payment.changeAmount == null ? null : Number(payment.changeAmount),
      cashSessionId: payment.cashSession?.id ?? null,
      order: {
        id: payment.order.id,
        createdAt: payment.order.createdAt,
        tableNumber: payment.order.table.number,
        total: Number(payment.order.total),
        items: payment.order.items.map((item) => ({
          id: item.id,
          name: item.menuItem.name,
          quantity: item.quantity,
          unitPrice: Number(item.unitPrice),
          subtotal: Number(item.subtotal),
        })),
      },
    };
  }

  async create(dto: CreatePaymentDto, createdBy: UserEntity) {
    const payment = await this.dataSource.transaction(async (manager) => {
      const orders = manager.getRepository(OrderEntity);
      const payments = manager.getRepository(PaymentEntity);
      const tables = manager.getRepository(TableEntity);
      const sessions = manager.getRepository(CashSessionEntity);
      const kitchenOrders = manager.getRepository(KitchenOrderEntity);
      const lockedOrder = await orders.findOne({
        where: { id: dto.orderId },
        lock: { mode: 'pessimistic_write' },
        loadEagerRelations: false,
      });
      if (!lockedOrder) throw new NotFoundException('Orden no encontrada');
      const order = await orders.findOneOrFail({
        where: { id: dto.orderId },
        relations: { table: true, createdBy: true },
        loadEagerRelations: false,
      });
      this.assertOrderAccess(order, createdBy);
      if (order.status === OrderStatus.CANCELLED)
        throw new BadRequestException('No se puede cobrar una orden cancelada');
      if (order.status === OrderStatus.COMPLETED)
        throw new ConflictException('La orden ya fue cobrada');
      if (order.status !== OrderStatus.READY)
        throw new ConflictException(
          'La orden debe estar lista antes de registrar el pago',
        );
      const kitchenOrder = await kitchenOrders.findOne({
        where: { order: { id: order.id } },
        loadEagerRelations: false,
      });
      if (!kitchenOrder || kitchenOrder.status !== KitchenStatus.READY) {
        throw new ConflictException(
          'La orden debe estar lista en cocina antes de cobrarla',
        );
      }
      if (await payments.findOne({ where: { order: { id: order.id } } })) {
        throw new ConflictException('La orden ya tiene un pago registrado');
      }
      const session = await sessions.findOne({
        where: {
          openedBy: { id: createdBy.id },
          status: CashSessionStatus.OPEN,
        },
        lock: { mode: 'pessimistic_write' },
        loadEagerRelations: false,
      });
      if (!session)
        throw new ConflictException(
          'Debes abrir una caja antes de registrar pagos',
        );
      const cashAmounts = this.cashAmounts(dto, Number(order.total));
      const payment = await payments.save(
        payments.create({
          order,
          createdBy,
          cashSession: session,
          method: dto.method,
          amount: Number(order.total),
          ...cashAmounts,
        }),
      );
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
