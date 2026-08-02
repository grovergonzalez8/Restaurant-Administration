import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { CloseCashSessionDto } from 'src/core/dtos/cash-sessions/close-cash-session.dto';
import { OpenCashSessionDto } from 'src/core/dtos/cash-sessions/open-cash-session.dto';
import { CashSessionEntity } from 'src/core/entities/cash-session.entity';
import { PaymentEntity } from 'src/core/entities/payment.entity';
import { UserEntity } from 'src/core/entities/user.entity';
import { CashSessionStatus } from 'src/core/enums/cash-session-status.enum';
import { PaymentMethod } from 'src/core/enums/payment-method.enum';
import { DataSource, Repository } from 'typeorm';

@Injectable()
export class CashSessionsService {
  constructor(
    @InjectRepository(CashSessionEntity)
    private readonly sessions: Repository<CashSessionEntity>,
    @InjectRepository(PaymentEntity)
    private readonly payments: Repository<PaymentEntity>,
    private readonly dataSource: DataSource,
  ) {}

  findAll() {
    return this.sessions.find({ order: { openedAt: 'DESC' } });
  }

  findCurrent(userId: string) {
    return this.sessions.findOne({
      where: { openedBy: { id: userId }, status: CashSessionStatus.OPEN },
    });
  }

  async open(dto: OpenCashSessionDto, user: UserEntity) {
    return this.dataSource.transaction(async (manager) => {
      const users = manager.getRepository(UserEntity);
      const sessions = manager.getRepository(CashSessionEntity);
      const lockedUser = await users.findOne({
        where: { id: user.id },
        lock: { mode: 'pessimistic_write' },
        loadEagerRelations: false,
      });
      if (!lockedUser) throw new NotFoundException('Usuario no encontrado');
      const existing = await sessions.findOne({
        where: { openedBy: { id: user.id }, status: CashSessionStatus.OPEN },
      });
      if (existing) throw new ConflictException('Ya tienes una caja abierta');
      return sessions.save(
        sessions.create({
          openedBy: user,
          openingBalance: dto.openingBalance,
        }),
      );
    });
  }

  private canAccess(session: CashSessionEntity, user: UserEntity) {
    return session.openedBy.id === user.id || user.role?.name === 'admin';
  }

  private buildSummary(session: CashSessionEntity, payments: PaymentEntity[]) {
    const byMethod = Object.values(PaymentMethod).reduce<
      Record<PaymentMethod, number>
    >(
      (totals, method) => {
        totals[method] = payments
          .filter((payment) => payment.method === method)
          .reduce((sum, payment) => sum + Number(payment.amount), 0);
        return totals;
      },
      {} as Record<PaymentMethod, number>,
    );
    return {
      sessionId: session.id,
      status: session.status,
      payments: payments.length,
      byMethod,
      totalSales: Object.values(byMethod).reduce(
        (sum, total) => sum + total,
        0,
      ),
      expectedCash:
        Number(session.openingBalance) + byMethod[PaymentMethod.CASH],
    };
  }

  async summary(id: string, user: UserEntity) {
    const session = await this.sessions.findOne({ where: { id } });
    if (!session) throw new NotFoundException('Caja no encontrada');
    if (!this.canAccess(session, user))
      throw new ForbiddenException('No puedes consultar esta caja');
    const payments = await this.payments.find({
      where: { cashSession: { id } },
    });
    return this.buildSummary(session, payments);
  }

  async close(id: string, dto: CloseCashSessionDto, user: UserEntity) {
    return this.dataSource.transaction(async (manager) => {
      const sessions = manager.getRepository(CashSessionEntity);
      const paymentsRepository = manager.getRepository(PaymentEntity);
      const locked = await sessions.findOne({
        where: { id },
        lock: { mode: 'pessimistic_write' },
        loadEagerRelations: false,
      });
      if (!locked) throw new NotFoundException('Caja no encontrada');
      const session = await sessions.findOneOrFail({
        where: { id },
        relations: { openedBy: { role: true } },
        loadEagerRelations: false,
      });
      if (session.status === CashSessionStatus.CLOSED)
        throw new ConflictException('La caja ya fue cerrada');
      if (!this.canAccess(session, user))
        throw new ForbiddenException('No puedes cerrar esta caja');
      const payments = await paymentsRepository.find({
        where: { cashSession: { id } },
      });
      const summary = this.buildSummary(session, payments);
      session.expectedBalance = summary.expectedCash;
      session.closingBalance = dto.closingBalance;
      session.difference = dto.closingBalance - summary.expectedCash;
      session.closedAt = new Date();
      session.status = CashSessionStatus.CLOSED;
      return sessions.save(session);
    });
  }
}
