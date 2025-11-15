import { Entity, PrimaryGeneratedColumn, ManyToOne, Column, CreateDateColumn, UpdateDateColumn } from "typeorm";
import { OrderEntity } from "./order.entity";
import { KitchenStatus } from "../enums/kitchen-status.enum";

@Entity('kitchenOrders')
export class KitchenOrderEntity {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @ManyToOne(() => OrderEntity, { eager: true, onDelete: 'CASCADE' })
    order: OrderEntity;

    @Column({ type: 'enum', enum: KitchenStatus, default: KitchenStatus.PENDING })
    status: KitchenStatus;

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;
}