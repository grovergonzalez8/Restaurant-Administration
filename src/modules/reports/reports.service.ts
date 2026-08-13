import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ReportPeriodDto } from 'src/core/dtos/reports/report-period.dto';
import { InventoryEntryEntity } from 'src/core/entities/inventory-entry.entity';
import { InventoryOutputEntity } from 'src/core/entities/inventory-output.entity';
import { PaymentEntity } from 'src/core/entities/payment.entity';
import { PaymentMethod } from 'src/core/enums/payment-method.enum';
import { InventoryOutputReason } from 'src/core/enums/inventory-output-reason.enum';
import {
  Between,
  FindOperator,
  LessThanOrEqual,
  MoreThanOrEqual,
  Repository,
} from 'typeorm';

@Injectable()
export class ReportsService {
  constructor(
    @InjectRepository(PaymentEntity)
    private readonly payments: Repository<PaymentEntity>,
    @InjectRepository(InventoryEntryEntity)
    private readonly entries: Repository<InventoryEntryEntity>,
    @InjectRepository(InventoryOutputEntity)
    private readonly outputs: Repository<InventoryOutputEntity>,
  ) {}

  private parseBoundary(value: string, endOfDay: boolean) {
    const dateOnly = /^\d{4}-\d{2}-\d{2}$/.test(value);
    const date = new Date(
      dateOnly
        ? `${value}T${endOfDay ? '23:59:59.999' : '00:00:00.000'}Z`
        : value,
    );
    if (Number.isNaN(date.getTime())) {
      throw new BadRequestException('Periodo de reporte no válido');
    }
    return date;
  }

  private dateRange(period: ReportPeriodDto): FindOperator<Date> | undefined {
    const from = period.from ? this.parseBoundary(period.from, false) : null;
    const to = period.to ? this.parseBoundary(period.to, true) : null;
    if (from && to && from > to) {
      throw new BadRequestException(
        'La fecha inicial no puede ser posterior a la final',
      );
    }
    if (from && to) return Between(from, to);
    if (from) return MoreThanOrEqual(from);
    if (to) return LessThanOrEqual(to);
    return undefined;
  }

  async sales(period: ReportPeriodDto) {
    const createdAt = this.dateRange(period);
    const payments = await this.payments.find({
      where: createdAt ? { createdAt } : {},
      order: { createdAt: 'ASC' },
    });
    const byMethod = Object.values(PaymentMethod).reduce<
      Record<PaymentMethod, number>
    >(
      (result, method) => {
        result[method] = 0;
        return result;
      },
      {} as Record<PaymentMethod, number>,
    );
    for (const payment of payments) {
      byMethod[payment.method] += Number(payment.amount);
    }
    const total = payments.reduce(
      (sum, payment) => sum + Number(payment.amount),
      0,
    );
    return {
      payments: payments.length,
      total,
      averageTicket: payments.length ? total / payments.length : 0,
      byMethod,
    };
  }

  async topProducts(period: ReportPeriodDto) {
    const createdAt = this.dateRange(period);
    const payments = await this.payments.find({
      where: createdAt ? { createdAt } : {},
      relations: { order: { items: { menuItem: true } } },
      loadEagerRelations: false,
    });
    const products = new Map<
      string,
      { id: string; name: string; quantity: number; sales: number }
    >();
    for (const payment of payments) {
      for (const item of payment.order.items) {
        const current = products.get(item.menuItem.id) ?? {
          id: item.menuItem.id,
          name: item.menuItem.name,
          quantity: 0,
          sales: 0,
        };
        current.quantity += item.quantity;
        current.sales += Number(item.subtotal);
        products.set(item.menuItem.id, current);
      }
    }
    return [...products.values()].sort((a, b) => b.quantity - a.quantity);
  }

  async inventory(period: ReportPeriodDto) {
    const createdAt = this.dateRange(period);
    const options = {
      where: createdAt ? { createdAt } : {},
      relations: { item: true },
      loadEagerRelations: false,
    };
    const [entries, outputs] = await Promise.all([
      this.entries.find(options),
      this.outputs.find(options),
    ]);
    const roundQuantity = (value: number) =>
      Math.round((value + Number.EPSILON) * 100) / 100;
    const items = new Map<
      string,
      {
        name: string;
        unit: string;
        entries: number;
        outputs: number;
        net: number;
      }
    >();
    const movement = (
      item: InventoryEntryEntity | InventoryOutputEntity,
      type: 'entries' | 'outputs',
    ) => {
      const key = `${item.item.name.trim().toLowerCase()}::${item.item.unit
        .trim()
        .toLowerCase()}`;
      const current = items.get(key) ?? {
        name: item.item.name,
        unit: item.item.unit,
        entries: 0,
        outputs: 0,
        net: 0,
      };
      const quantity = Number(item.quantity);
      current[type] = roundQuantity(current[type] + quantity);
      current.net = roundQuantity(current.entries - current.outputs);
      items.set(key, current);
    };
    entries.forEach((entry) => movement(entry, 'entries'));
    outputs.forEach((output) => movement(output, 'outputs'));
    return {
      movements: { entries: entries.length, outputs: outputs.length },
      items: [...items.values()].sort((a, b) => a.name.localeCompare(b.name)),
    };
  }

  async waste(period: ReportPeriodDto) {
    const createdAt = this.dateRange(period);
    const outputs = await this.outputs.find({
      where: createdAt
        ? { reason: InventoryOutputReason.WASTE, createdAt }
        : { reason: InventoryOutputReason.WASTE },
      relations: { item: true },
      loadEagerRelations: false,
      order: { createdAt: 'DESC' },
    });
    const items = new Map<
      string,
      {
        id: string;
        name: string;
        unit: string;
        quantity: number;
        movements: number;
      }
    >();
    const roundQuantity = (value: number) =>
      Math.round((value + Number.EPSILON) * 100) / 100;

    for (const output of outputs) {
      const current = items.get(output.item.id) ?? {
        id: output.item.id,
        name: output.item.name,
        unit: output.item.unit,
        quantity: 0,
        movements: 0,
      };
      current.quantity = roundQuantity(
        current.quantity + Number(output.quantity),
      );
      current.movements += 1;
      items.set(output.item.id, current);
    }

    return {
      movements: outputs.length,
      items: [...items.values()].sort((a, b) => a.name.localeCompare(b.name)),
    };
  }
}
