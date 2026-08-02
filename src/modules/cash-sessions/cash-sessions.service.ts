import { ConflictException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { CloseCashSessionDto } from 'src/core/dtos/cash-sessions/close-cash-session.dto';
import { OpenCashSessionDto } from 'src/core/dtos/cash-sessions/open-cash-session.dto';
import { CashSessionEntity } from 'src/core/entities/cash-session.entity';
import { PaymentEntity } from 'src/core/entities/payment.entity';
import { UserEntity } from 'src/core/entities/user.entity';
import { CashSessionStatus } from 'src/core/enums/cash-session-status.enum';
import { PaymentMethod } from 'src/core/enums/payment-method.enum';
import { Repository } from 'typeorm';

@Injectable()
export class CashSessionsService {
  constructor(
    @InjectRepository(CashSessionEntity) private readonly sessions: Repository<CashSessionEntity>,
    @InjectRepository(PaymentEntity) private readonly payments: Repository<PaymentEntity>,
  ) {}

  findAll() { return this.sessions.find({ order: { openedAt: 'DESC' } }); }

  findCurrent(userId: string) {
    return this.sessions.findOne({ where: { openedBy: { id: userId }, status: CashSessionStatus.OPEN } });
  }

  async open(dto: OpenCashSessionDto, user: UserEntity) {
    if (await this.findCurrent(user.id)) throw new ConflictException('Ya tienes una caja abierta');
    return this.sessions.save(this.sessions.create({ openedBy: user, openingBalance: dto.openingBalance }));
  }

  async close(id: string, dto: CloseCashSessionDto, user: UserEntity) {
    const session = await this.sessions.findOne({ where: { id } });
    if (!session) throw new NotFoundException('Caja no encontrada');
    if (session.status === CashSessionStatus.CLOSED) throw new ConflictException('La caja ya fue cerrada');
    if (session.openedBy.id !== user.id && user.role?.name !== 'admin') throw new ForbiddenException('No puedes cerrar esta caja');
    const closedAt = new Date();
    const payments = await this.payments.find({ where: { createdBy: { id: session.openedBy.id } } });
    const cashSales = payments
      .filter((payment) => payment.method === PaymentMethod.CASH && payment.createdAt >= session.openedAt && payment.createdAt <= closedAt)
      .reduce((sum, payment) => sum + Number(payment.amount), 0);
    session.expectedBalance = Number(session.openingBalance) + cashSales;
    session.closingBalance = dto.closingBalance;
    session.difference = dto.closingBalance - session.expectedBalance;
    session.closedAt = closedAt;
    session.status = CashSessionStatus.CLOSED;
    return this.sessions.save(session);
  }
}
