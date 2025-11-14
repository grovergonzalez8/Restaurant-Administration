import { Entity, PrimaryGeneratedColumn, ManyToOne, Column, OneToMany, CreateDateColumn, UpdateDateColumn } from "typeorm";
import { UserEntity } from "./user.entity";
import { OrderItemEntity } from "./order-item.entity";

@Entity('orders')
export class OrderEntity {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @ManyToOne(() => UserEntity, { eager: true })
    user: UserEntity;

    @Column({ type: 'decimal', precision: 10, scale: 2 })
    total: number;

    @Column({ default: 'pending' })
    status: 'pending' | 'preparing' | 'delivered' | 'cancelled';

    @OneToMany(() => OrderItemEntity, (item) => item.order, { cascade: true, eager: true })
    items: OrderItemEntity[];

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;
}