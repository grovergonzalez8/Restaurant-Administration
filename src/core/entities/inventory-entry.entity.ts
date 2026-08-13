import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { InventoryItemEntity } from './inventory-item.entity';
import { UserEntity } from './user.entity';

@Entity('inventoryEntries')
export class InventoryEntryEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => InventoryItemEntity, (item) => item.entries, {
    eager: true,
    nullable: false,
  })
  item: InventoryItemEntity;

  @Column('decimal', { precision: 10, scale: 2 })
  quantity: number;

  @ManyToOne(() => UserEntity, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'performedById' })
  performedBy?: UserEntity;

  @Column({ nullable: true })
  note?: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
