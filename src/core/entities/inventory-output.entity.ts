import { Column, CreateDateColumn, Entity, ManyToOne, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";
import { InventoryItemEntity } from "./inventory-item.entity";

@Entity('inventoryOutputs')
export class InventoryOutputEntity {
 
    @PrimaryGeneratedColumn('uuid')
    id: string; 
    
    @ManyToOne(() => InventoryItemEntity, { eager: true })
    item: InventoryItemEntity;

    @Column('decimal', { precision: 10, scale: 2 })
    quantity: number;

    @Column({ nullable: true })
    note?: string;  
    
    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;
}