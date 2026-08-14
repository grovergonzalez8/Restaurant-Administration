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

  it('calculates recipe cost and gross profit from current ingredient costs', async () => {
    menu.find.mockResolvedValue([
      { id: 'menu-1', name: 'Silpancho', price: '40.00' },
      { id: 'menu-2', name: 'Agua', price: '8.00' },
    ]);
    recipes.find.mockResolvedValue([
      {
        id: 'recipe-1',
        menuItem: { id: 'menu-1' },
        quantity: '0.25',
        inventoryItem: {
          id: 'stock-1',
          name: 'Carne',
          unit: 'kg',
          unitCost: '52.00',
        },
      },
      {
        id: 'recipe-2',
        menuItem: { id: 'menu-1' },
        quantity: '0.10',
        inventoryItem: {
          id: 'stock-2',
          name: 'Arroz',
          unit: 'kg',
          unitCost: '12.00',
        },
      },
    ]);

    await expect(service.menuCosts()).resolves.toEqual([
      expect.objectContaining({
        menuItemId: 'menu-1',
        tracked: true,
        ingredientCount: 2,
        cost: 14.2,
        grossProfit: 25.8,
        foodCostPercentage: 35.5,
      }),
      expect.objectContaining({
        menuItemId: 'menu-2',
        tracked: false,
        cost: null,
        grossProfit: null,
      }),
    ]);
  });

  it('updates ingredient quantity', async () => {
    const recipeItem = { id: 'recipe-1', quantity: 1 };
    recipes.findOne.mockResolvedValue(recipeItem);
    recipes.save.mockImplementation((value: unknown) => Promise.resolve(value));

    const result = await service.update('recipe-1', { quantity: 1.5 });

    expect(result).toEqual({ id: 'recipe-1', quantity: 1.5 });
  });
});
