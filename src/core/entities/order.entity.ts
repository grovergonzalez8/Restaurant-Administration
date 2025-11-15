import { Entity, PrimaryGeneratedColumn, ManyToOne, Column, OneToMany, CreateDateColumn, UpdateDateColumn } from "typeorm";
import { UserEntity } from "./user.entity";
import { OrderItemEntity } from "./order-item.entity";
import { OrderStatus } from "../enums/order-status.enum";
import { TableEntity } from "./table.entity";

@Entity('orders')
export class OrderEntity {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @ManyToOne(() => TableEntity, table => table.orders, { eager: true } )
    table: TableEntity;

    @Column({ type: 'enum', enum: OrderStatus, default: OrderStatus.PENDING })
    status: OrderStatus;

    @Column('decimal', { precision: 10, scale: 2, default: 0 })
    total: number;

    @OneToMany(() => OrderItemEntity, item => item.order, { cascade: true, eager: true })
    items: OrderItemEntity[];

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;
}