import { Entity, PrimaryGeneratedColumn, ManyToOne, JoinColumn, Column } from "typeorm";
import { MenuItemEntity } from "./menu-item.entity";
import { OrderEntity } from "./order.entity";

@Entity('order_items')
export class OrderItemEntity {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @ManyToOne(() => OrderEntity, (order) => order.items)
    @JoinColumn({ name: 'order_id' })
    order: OrderEntity;

    @ManyToOne(() => MenuItemEntity, { eager: true })
    @JoinColumn({ name: 'menu_item_id' })
    menuItem: MenuItemEntity;

    @Column()
    quantity: number;

    @Column('decimal', { precision: 10, scale: 2 })
    subtotal: number;
}