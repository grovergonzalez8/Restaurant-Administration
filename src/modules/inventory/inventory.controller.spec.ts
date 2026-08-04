import { InventoryController } from './inventory.controller';
import { InventoryService } from './inventory.service';

describe('InventoryController', () => {
  const inventoryService = { findLowStock: jest.fn() };
  const controller = new InventoryController(
    inventoryService as unknown as InventoryService,
  );

  beforeEach(() => jest.clearAllMocks());

  it('returns the low-stock items', async () => {
    const items = [{ id: 'item-1', name: 'Tomate' }];
    inventoryService.findLowStock.mockResolvedValue(items);

    await expect(controller.findLowStock()).resolves.toBe(items);
    expect(inventoryService.findLowStock).toHaveBeenCalledTimes(1);
  });
});
