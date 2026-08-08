import { Repository } from 'typeorm';
import { InventoryItemEntity } from 'src/core/entities/inventory-item.entity';
import { MenuItemEntity } from 'src/core/entities/menu-item.entity';
import { RecipeItemEntity } from 'src/core/entities/recipe-item.entity';
import { MenuStatus } from 'src/core/enums/menu-status.enum';
import { RecipesService } from './recipes.service';

describe('RecipesService availability', () => {
  const recipes = { find: jest.fn(), findOne: jest.fn(), save: jest.fn() };
  const menu = { find: jest.fn(), findOne: jest.fn(), exist: jest.fn() };
  const service = new RecipesService(
    recipes as unknown as Repository<RecipeItemEntity>,
    menu as unknown as Repository<MenuItemEntity>,
    {} as Repository<InventoryItemEntity>,
  );

  beforeEach(() => jest.clearAllMocks());

  it('calculates maximum servings from the limiting ingredient', async () => {
    menu.findOne.mockResolvedValue({
      id: 'menu-1',
      status: MenuStatus.AVAIBLE,
    });
    recipes.find.mockResolvedValue([
      {
        quantity: 2,
        inventoryItem: { id: 'stock-1', name: 'Carne', quantity: 10 },
      },
      {
        quantity: 1,
        inventoryItem: { id: 'stock-2', name: 'Pan', quantity: 3 },
      },
    ]);

    const result = await service.availability('menu-1');

    expect(result.available).toBe(true);
    expect(result.maxServings).toBe(3);
    expect(result.shortages).toEqual([]);
  });

  it('reports an untracked item when no recipe is configured', async () => {
    menu.findOne.mockResolvedValue({
      id: 'menu-1',
      status: MenuStatus.AVAIBLE,
    });
    recipes.find.mockResolvedValue([]);

    const result = await service.availability('menu-1');

    expect(result.tracked).toBe(false);
    expect(result.maxServings).toBeNull();
  });

  it('returns availability for all sellable menu items in one query', async () => {
    menu.find.mockResolvedValue([
      { id: 'menu-1', status: MenuStatus.AVAIBLE },
      { id: 'menu-2', status: MenuStatus.AVAIBLE },
    ]);
    recipes.find.mockResolvedValue([
      {
        menuItem: { id: 'menu-1' },
        quantity: 2,
        inventoryItem: { id: 'stock-1', name: 'Carne', quantity: 3 },
      },
    ]);

    await expect(service.menuAvailability()).resolves.toEqual([
      expect.objectContaining({
        menuItemId: 'menu-1',
        tracked: true,
        available: true,
        maxServings: 1,
      }),
      expect.objectContaining({
        menuItemId: 'menu-2',
        tracked: false,
        available: true,
        maxServings: null,
      }),
    ]);
    expect(menu.find).toHaveBeenCalledTimes(1);
    expect(recipes.find).toHaveBeenCalledTimes(1);
  });

  it('updates ingredient quantity', async () => {
    const recipeItem = { id: 'recipe-1', quantity: 1 };
    recipes.findOne.mockResolvedValue(recipeItem);
    recipes.save.mockImplementation((value: unknown) => Promise.resolve(value));

    const result = await service.update('recipe-1', { quantity: 1.5 });

    expect(result).toEqual({ id: 'recipe-1', quantity: 1.5 });
  });
});
