import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { CreateRecipeItemDto } from 'src/core/dtos/recipes/create-recipe-item.dto';
import { UpdateRecipeItemDto } from 'src/core/dtos/recipes/update-recipe-item.dto';
import { InventoryItemEntity } from 'src/core/entities/inventory-item.entity';
import { MenuItemEntity } from 'src/core/entities/menu-item.entity';
import { RecipeItemEntity } from 'src/core/entities/recipe-item.entity';
import { MenuStatus } from 'src/core/enums/menu-status.enum';
import { Repository } from 'typeorm';

@Injectable()
export class RecipesService {
  constructor(
    @InjectRepository(RecipeItemEntity)
    private readonly recipes: Repository<RecipeItemEntity>,
    @InjectRepository(MenuItemEntity)
    private readonly menu: Repository<MenuItemEntity>,
    @InjectRepository(InventoryItemEntity)
    private readonly inventory: Repository<InventoryItemEntity>,
  ) {}

  findAll() {
    return this.recipes.find();
  }

  async findByMenuItem(menuItemId: string) {
    if (!(await this.menu.exist({ where: { id: menuItemId } }))) {
      throw new NotFoundException('Producto de menú no encontrado');
    }
    return this.recipes.find({ where: { menuItem: { id: menuItemId } } });
  }

  async availability(menuItemId: string) {
    const menuItem = await this.menu.findOne({ where: { id: menuItemId } });
    if (!menuItem)
      throw new NotFoundException('Producto de menú no encontrado');
    const ingredients = await this.recipes.find({
      where: { menuItem: { id: menuItemId } },
    });
    return this.calculateAvailability(menuItem, ingredients);
  }

  async menuAvailability() {
    const [menuItems, ingredients] = await Promise.all([
      this.menu.find({ where: { status: MenuStatus.AVAIBLE } }),
      this.recipes.find(),
    ]);
    const ingredientsByMenuItem = new Map<string, RecipeItemEntity[]>();
    ingredients.forEach((ingredient) => {
      const menuItemId = ingredient.menuItem.id;
      ingredientsByMenuItem.set(menuItemId, [
        ...(ingredientsByMenuItem.get(menuItemId) ?? []),
        ingredient,
      ]);
    });
    return menuItems.map((menuItem) =>
      this.calculateAvailability(
        menuItem,
        ingredientsByMenuItem.get(menuItem.id) ?? [],
      ),
    );
  }

  private calculateAvailability(
    menuItem: MenuItemEntity,
    ingredients: RecipeItemEntity[],
  ) {
    if (!ingredients.length) {
      return {
        menuItemId: menuItem.id,
        available: menuItem.status === MenuStatus.AVAIBLE,
        tracked: false,
        maxServings: null,
        shortages: [],
      };
    }
    const details = ingredients.map((ingredient) => {
      const stock = Number(ingredient.inventoryItem.quantity);
      const required = Number(ingredient.quantity);
      return {
        inventoryItemId: ingredient.inventoryItem.id,
        name: ingredient.inventoryItem.name,
        stock,
        required,
        servings: Math.floor(stock / required),
      };
    });
    const maxServings = Math.min(...details.map((item) => item.servings));
    return {
      menuItemId: menuItem.id,
      available: menuItem.status === MenuStatus.AVAIBLE && maxServings > 0,
      tracked: true,
      maxServings,
      shortages: details.filter((item) => item.servings === 0),
    };
  }

  async create(dto: CreateRecipeItemDto) {
    const [menuItem, inventoryItem, existing] = await Promise.all([
      this.menu.findOne({ where: { id: dto.menuItemId } }),
      this.inventory.findOne({ where: { id: dto.inventoryItemId } }),
      this.recipes.findOne({
        where: {
          menuItem: { id: dto.menuItemId },
          inventoryItem: { id: dto.inventoryItemId },
        },
      }),
    ]);
    if (!menuItem)
      throw new NotFoundException('Producto de menú no encontrado');
    if (!inventoryItem) throw new NotFoundException('Insumo no encontrado');
    if (existing)
      throw new ConflictException('El ingrediente ya está en la receta');
    return this.recipes.save(
      this.recipes.create({ menuItem, inventoryItem, quantity: dto.quantity }),
    );
  }

  async update(id: string, dto: UpdateRecipeItemDto) {
    const recipeItem = await this.recipes.findOne({ where: { id } });
    if (!recipeItem)
      throw new NotFoundException('Ingrediente de receta no encontrado');
    recipeItem.quantity = dto.quantity;
    return this.recipes.save(recipeItem);
  }

  async remove(id: string) {
    const result = await this.recipes.delete(id);
    if (!result.affected)
      throw new NotFoundException('Ingrediente de receta no encontrado');
  }
}
