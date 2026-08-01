import { Column, Entity, ManyToOne, PrimaryGeneratedColumn, Unique } from 'typeorm';
import { InventoryItemEntity } from './inventory-item.entity';
import { MenuItemEntity } from './menu-item.entity';

@Entity('recipeItems')
@Unique(['menuItem', 'inventoryItem'])
export class RecipeItemEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => MenuItemEntity, { eager: true, onDelete: 'CASCADE' })
  menuItem: MenuItemEntity;

  @ManyToOne(() => InventoryItemEntity, { eager: true, onDelete: 'RESTRICT' })
  inventoryItem: InventoryItemEntity;

  @Column('decimal', { precision: 10, scale: 2 })
  quantity: number;
}
