import { Column, CreateDateColumn, Entity, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { UserEntity } from './user.entity';
import { CashSessionStatus } from '../enums/cash-session-status.enum';

@Entity('cashSessions')
export class CashSessionEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => UserEntity, { eager: true })
  openedBy: UserEntity;

  @Column('decimal', { precision: 10, scale: 2 })
  openingBalance: number;

  @Column('decimal', { precision: 10, scale: 2, nullable: true })
  expectedBalance?: number;

  @Column('decimal', { precision: 10, scale: 2, nullable: true })
  closingBalance?: number;

  @Column('decimal', { precision: 10, scale: 2, nullable: true })
  difference?: number;

  @Column({ type: 'enum', enum: CashSessionStatus, default: CashSessionStatus.OPEN })
  status: CashSessionStatus;

  @CreateDateColumn()
  openedAt: Date;

  @Column({ type: 'timestamp', nullable: true })
  closedAt?: Date;
}
