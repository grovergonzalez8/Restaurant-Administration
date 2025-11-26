import { Column, CreateDateColumn, Entity, OneToMany, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";
import { InventoryOutputEntity } from "./inventory-output.entity";
import { InventoryEntryEntity } from "./inventory-entry.entity";

@Entity('inventoryItem')
export class InventoryItemEntity {
   @PrimaryGeneratedColumn('uuid') 
    id: string;

    @Column()
    name: string;

    @Column({ nullable: true })
    description?: string;
    
    @Column('decimal', { precision: 10, scale: 2, default: 0 })
    quantity: number;

    @Column()
    unit: string;

    @OneToMany(() => InventoryEntryEntity, entry => entry.item)
    entries: InventoryEntryEntity[];

    @OneToMany(() => InventoryOutputEntity, output => output.item)
    outputs: InventoryOutputEntity[];
    
    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;
}