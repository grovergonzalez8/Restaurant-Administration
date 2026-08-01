import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ReportPeriodDto } from 'src/core/dtos/reports/report-period.dto';
import { InventoryEntryEntity } from 'src/core/entities/inventory-entry.entity';
import { InventoryOutputEntity } from 'src/core/entities/inventory-output.entity';
import { OrderItemEntity } from 'src/core/entities/order-item.entity';
import { PaymentEntity } from 'src/core/entities/payment.entity';
import { PaymentMethod } from 'src/core/enums/payment-method.enum';
import { OrderStatus } from 'src/core/enums/order-status.enum';
import { Repository } from 'typeorm';

@Injectable()
export class ReportsService {
  constructor(
    @InjectRepository(PaymentEntity) private readonly payments: Repository<PaymentEntity>,
    @InjectRepository(OrderItemEntity) private readonly orderItems: Repository<OrderItemEntity>,
    @InjectRepository(InventoryEntryEntity) private readonly entries: Repository<InventoryEntryEntity>,
    @InjectRepository(InventoryOutputEntity) private readonly outputs: Repository<InventoryOutputEntity>,
  ) {}

  private inPeriod(date: Date, period: ReportPeriodDto) {
    const from = period.from ? new Date(period.from) : undefined;
    const to = period.to ? new Date(`${period.to}T23:59:59.999Z`) : undefined;
    return (!from || date >= from) && (!to || date <= to);
  }

  async sales(period: ReportPeriodDto) {
    const payments = (await this.payments.find()).filter((payment) => this.inPeriod(payment.createdAt, period));
    const byMethod = Object.values(PaymentMethod).reduce<Record<PaymentMethod, number>>((result, method) => {
      result[method] = 0;
      return result;
    }, {} as Record<PaymentMethod, number>);
    for (const payment of payments) byMethod[payment.method] += Number(payment.amount);
    return { payments: payments.length, total: payments.reduce((sum, payment) => sum + Number(payment.amount), 0), byMethod };
  }

  async topProducts(period: ReportPeriodDto) {
    const items = await this.orderItems.find({ relations: { order: true, menuItem: true } });
    const products = new Map<string, { name: string; quantity: number; sales: number }>();
    for (const item of items) {
      if (item.order.status !== OrderStatus.COMPLETED || !this.inPeriod(item.order.createdAt, period)) continue;
      const current = products.get(item.menuItem.id) ?? { name: item.menuItem.name, quantity: 0, sales: 0 };
      current.quantity += item.quantity;
      current.sales += Number(item.subtotal);
      products.set(item.menuItem.id, current);
    }
    return [...products.values()].sort((a, b) => b.quantity - a.quantity);
  }

  async inventory(period: ReportPeriodDto) {
    const [entries, outputs] = await Promise.all([this.entries.find(), this.outputs.find()]);
    const incoming = entries.filter((entry) => this.inPeriod(entry.createdAt, period));
    const outgoing = outputs.filter((output) => this.inPeriod(output.createdAt, period));
    return {
      entries: incoming.reduce((sum, entry) => sum + Number(entry.quantity), 0),
      outputs: outgoing.reduce((sum, output) => sum + Number(output.quantity), 0),
      movements: { entries: incoming.length, outputs: outgoing.length },
    };
  }
}
