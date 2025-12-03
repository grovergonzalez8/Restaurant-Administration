import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToMany } from "typeorm";
import { MenuStatus } from "../enums/menu-status.enum";
import { OrderItemEntity } from "./order-item.entity";

@Entity('MenuItems')
export class MenuItemEntity {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column()
    name: string;

    @Column({ nullable: true })
    description?: string;

    @Column('decimal', { precision: 10, scale: 2 })
    price: number;

    @Column({ type: 'enum', enum: MenuStatus ,default: MenuStatus.AVAIBLE })
    status: MenuStatus;

    @OneToMany(() => OrderItemEntity, orderItem => orderItem.menuItem)
    orderItems?: OrderItemEntity[];

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;
}