import { Entity, PrimaryGeneratedColumn, ManyToOne, JoinColumn, Column } from "typeorm";
import { MenuItemEntity } from "./menu-item.entity";
import { OrderEntity } from "./order.entity";

@Entity('OrderItems')
export class OrderItemEntity {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @ManyToOne(() => OrderEntity, order => order.items, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'orderId' })
    order: OrderEntity;

    @ManyToOne(() => MenuItemEntity, { eager: true })
    @JoinColumn({ name: 'menuItemId' })
    menuItem: MenuItemEntity;

    @Column()
    quantity: number;

    @Column('decimal', { precision: 10, scale: 2 })
    unitPrice: number;

    @Column('decimal', { precision: 10, scale: 2 })
    subtotal: number;
}