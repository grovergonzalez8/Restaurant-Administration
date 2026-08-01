import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { CreateRecipeItemDto } from 'src/core/dtos/recipes/create-recipe-item.dto';
import { InventoryItemEntity } from 'src/core/entities/inventory-item.entity';
import { MenuItemEntity } from 'src/core/entities/menu-item.entity';
import { RecipeItemEntity } from 'src/core/entities/recipe-item.entity';
import { Repository } from 'typeorm';

@Injectable()
export class RecipesService {
  constructor(
    @InjectRepository(RecipeItemEntity) private readonly recipes: Repository<RecipeItemEntity>,
    @InjectRepository(MenuItemEntity) private readonly menu: Repository<MenuItemEntity>,
    @InjectRepository(InventoryItemEntity) private readonly inventory: Repository<InventoryItemEntity>,
  ) {}

  findAll() { return this.recipes.find(); }

  findByMenuItem(menuItemId: string) { return this.recipes.find({ where: { menuItem: { id: menuItemId } } }); }

  async create(dto: CreateRecipeItemDto) {
    const [menuItem, inventoryItem, existing] = await Promise.all([
      this.menu.findOne({ where: { id: dto.menuItemId } }),
      this.inventory.findOne({ where: { id: dto.inventoryItemId } }),
      this.recipes.findOne({ where: { menuItem: { id: dto.menuItemId }, inventoryItem: { id: dto.inventoryItemId } } }),
    ]);
    if (!menuItem) throw new NotFoundException('Producto de menú no encontrado');
    if (!inventoryItem) throw new NotFoundException('Insumo no encontrado');
    if (existing) throw new ConflictException('El ingrediente ya está en la receta');
    return this.recipes.save(this.recipes.create({ menuItem, inventoryItem, quantity: dto.quantity }));
  }

  async remove(id: string) {
    const result = await this.recipes.delete(id);
    if (!result.affected) throw new NotFoundException('Ingrediente de receta no encontrado');
  }
}
