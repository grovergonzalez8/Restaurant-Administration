import { DataSource, EntityManager, Repository } from 'typeorm';
import { InventoryEntryEntity } from 'src/core/entities/inventory-entry.entity';
import { InventoryItemEntity } from 'src/core/entities/inventory-item.entity';
import { InventoryOutputEntity } from 'src/core/entities/inventory-output.entity';
import { InventoryService } from './inventory.service';
import { InventoryOutputReason } from 'src/core/enums/inventory-output-reason.enum';

describe('InventoryService traceability', () => {
  const items = {
    create: jest.fn(),
    findOne: jest.fn(),
    save: jest.fn(),
  };
  const entries = { create: jest.fn(), save: jest.fn() };
  const outputs = { create: jest.fn(), save: jest.fn() };
  const managerCreate = jest.fn();
  const managerSave = jest.fn();
  const manager = {
    create: managerCreate,
    save: managerSave,
    getRepository: jest.fn((entity: unknown) => {
      if (entity === InventoryItemEntity) return items;
      if (entity === InventoryEntryEntity) return entries;
      if (entity === InventoryOutputEntity) return outputs;
      throw new Error('Unexpected repository');
    }),
  } as unknown as EntityManager;
  const dataSource = {
    transaction: jest.fn((callback: (manager: EntityManager) => unknown) =>
      callback(manager),
    ),
  } as unknown as DataSource;
  const realtime = { emit: jest.fn() };
  const service = new InventoryService(
    {} as Repository<InventoryItemEntity>,
    {} as Repository<InventoryEntryEntity>,
    {} as Repository<InventoryOutputEntity>,
    dataSource,
    realtime,
  );

  beforeEach(() => jest.clearAllMocks());

  it('records initial stock as an inventory entry', async () => {
    const item = { id: 'stock-1', name: 'Carne', quantity: 10 };
    const entry = { id: 'entry-1', item, quantity: 10 };
    items.create.mockReturnValue(item);
    items.save.mockResolvedValue(item);
    entries.create.mockReturnValue(entry);
    entries.save.mockResolvedValue(entry);

    const result = await service.createItem({
      name: 'Carne',
      quantity: 10,
      minStock: 2,
      unit: 'kg',
    });

    expect(result).toBe(item);
    expect(entries.create).toHaveBeenCalledWith(
      expect.objectContaining({ quantity: 10, note: 'Stock inicial' }),
    );
    expect(realtime.emit).toHaveBeenCalledWith('inventory.entry', entry);
  });

  it('records a quantity reduction as an inventory output', async () => {
    const item = { id: 'stock-1', name: 'Carne', quantity: 10 };
    const output = { id: 'output-1', item, quantity: 4 };
    items.findOne.mockResolvedValue(item);
    items.save.mockResolvedValue(item);
    outputs.create.mockReturnValue(output);
    outputs.save.mockResolvedValue(output);

    const result = await service.updateItem(item.id, { quantity: 6 });

    expect(result.quantity).toBe(6);
    expect(outputs.create).toHaveBeenCalledWith(
      expect.objectContaining({
        quantity: 4,
        reason: InventoryOutputReason.ADJUSTMENT,
      }),
    );
    expect(realtime.emit).toHaveBeenCalledWith('inventory.output', output);
  });

  it('records the selected reason for a manual output', async () => {
    const item = { id: 'stock-1', name: 'Carne', quantity: 10 };
    const output = {
      id: 'output-1',
      item,
      quantity: 2,
      reason: InventoryOutputReason.WASTE,
    };
    items.findOne.mockResolvedValue(item);
    items.save.mockResolvedValue(item);
    managerCreate.mockReturnValue(output);
    managerSave.mockResolvedValue(output);

    const result = await service.createOutput({
      itemId: item.id,
      quantity: 2,
      reason: InventoryOutputReason.WASTE,
      note: 'Producto vencido',
    });

    expect(managerCreate).toHaveBeenCalledWith(
      InventoryOutputEntity,
      expect.objectContaining({ reason: InventoryOutputReason.WASTE }),
    );
    expect(result).toBe(output);
  });
});
