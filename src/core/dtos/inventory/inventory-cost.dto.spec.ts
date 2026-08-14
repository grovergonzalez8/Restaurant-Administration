import 'reflect-metadata';
import { validate } from 'class-validator';
import { CreateInventoryEntryDto } from './create-inventory-entry.dto';
import { CreateInventoryItemDto } from './create-inventory-item.dto';

describe('Inventory cost DTOs', () => {
  it('accepts non-negative unit costs', async () => {
    const item = Object.assign(new CreateInventoryItemDto(), {
      name: 'Carne',
      quantity: 10,
      minStock: 2,
      unit: 'kg',
      unitCost: 52,
    });

    await expect(validate(item)).resolves.toHaveLength(0);
  });

  it('rejects a negative entry unit cost', async () => {
    const entry = Object.assign(new CreateInventoryEntryDto(), {
      itemId: '2e9ac7cf-7210-4ee4-b39b-3ea50ff94e29',
      quantity: 2,
      unitCost: -1,
    });

    const properties = (await validate(entry)).map((error) => error.property);

    expect(properties).toContain('unitCost');
  });
});
