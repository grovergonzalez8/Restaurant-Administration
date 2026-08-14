import { ForbiddenException } from '@nestjs/common';
import { DataSource, EntityManager, Repository } from 'typeorm';
import { InventoryEntryEntity } from 'src/core/entities/inventory-entry.entity';
import { InventoryItemEntity } from 'src/core/entities/inventory-item.entity';
import { InventoryOutputEntity } from 'src/core/entities/inventory-output.entity';
import { KitchenOrderEntity } from 'src/core/entities/kitchen-order.entity';
import { MenuItemEntity } from 'src/core/entities/menu-item.entity';
import { OrderItemEntity } from 'src/core/entities/order-item.entity';
import { OrderEntity } from 'src/core/entities/order.entity';
import { RecipeItemEntity } from 'src/core/entities/recipe-item.entity';
import { TableEntity } from 'src/core/entities/table.entity';
import { UserEntity } from 'src/core/entities/user.entity';
import { MenuStatus } from 'src/core/enums/menu-status.enum';
import { OrderStatus } from 'src/core/enums/order-status.enum';
import { OrdersService } from './orders.service';

describe('OrdersService item editing', () => {
  const orders = {
    findOne: jest.fn(),
    findOneOrFail: jest.fn(),
    save: jest.fn(),
  };
  const menu = { findOne: jest.fn() };
  const recipes = { find: jest.fn() };
  const inventory = { findOne: jest.fn(), save: jest.fn() };
  const outputs = { create: jest.fn(), save: jest.fn() };
  const entries = { create: jest.fn(), save: jest.fn() };
  const items = {
    create: jest.fn(),
    save: jest.fn(),
    find: jest.fn(),
    delete: jest.fn(),
  };
  const manager = {
    getRepository: jest.fn((entity: unknown) => {
      if (entity === OrderEntity) return orders;
      if (entity === MenuItemEntity) return menu;
      if (entity === RecipeItemEntity) return recipes;
      if (entity === InventoryItemEntity) return inventory;
      if (entity === InventoryOutputEntity) return outputs;
      if (entity === InventoryEntryEntity) return entries;
      if (entity === OrderItemEntity) return items;
      throw new Error('Unexpected repository');
    }),
  } as unknown as EntityManager;
  const dataSource = {
    transaction: jest.fn((callback: (manager: EntityManager) => unknown) =>
      callback(manager),
    ),
  } as unknown as DataSource;
  const realtimeMock = { emit: jest.fn() };
  const service = new OrdersService(
    {} as Repository<OrderEntity>,
    {} as Repository<MenuItemEntity>,
    {} as Repository<TableEntity>,
    {} as Repository<KitchenOrderEntity>,
    dataSource,
    realtimeMock,
  );
  const actor = { id: 'user-1', role: { name: 'waiter' } } as UserEntity;

  beforeEach(() => jest.clearAllMocks());

  it('adds an item, consumes its recipe and recalculates total', async () => {
    const current = {
      id: 'order-1',
      status: OrderStatus.PENDING,
      createdBy: actor,
      items: [],
      total: 0,
    };
    const product = { id: 'menu-1', status: MenuStatus.AVAIBLE, price: 10 };
    const stock = { id: 'stock-1', name: 'Carne', quantity: 5, unitCost: 50 };
    const orderItem = {
      order: current,
      menuItem: product,
      quantity: 2,
      unitPrice: 10,
      subtotal: 20,
    };
    const updated = { ...current, items: [orderItem], total: 20 };
    orders.findOne.mockResolvedValue({ id: 'order-1' });
    orders.findOneOrFail
      .mockResolvedValueOnce(current)
      .mockResolvedValueOnce(updated);
    menu.findOne.mockResolvedValue(product);
    recipes.find.mockResolvedValue([{ quantity: 0.5, inventoryItem: stock }]);
    inventory.findOne.mockResolvedValue(stock);
    outputs.create.mockImplementation((value: unknown) => value);
    items.create.mockReturnValue(orderItem);
    items.find.mockResolvedValue([orderItem]);

    const result = await service.addItem(
      'order-1',
      { menuItemId: 'menu-1', quantity: 2 },
      actor,
    );

    expect(stock.quantity).toBe(4);
    expect(outputs.create).toHaveBeenCalledWith(
      expect.objectContaining({ performedBy: actor, unitCost: 50 }),
    );
    expect(current.total).toBe(20);
    expect(result).toBe(updated);
    expect(realtimeMock.emit).toHaveBeenCalledWith('order.updated', updated);
  });

  it('rejects changes from another waiter', async () => {
    const current = {
      id: 'order-1',
      status: OrderStatus.PENDING,
      createdBy: { id: 'other-user' },
      items: [],
    };
    orders.findOne.mockResolvedValue({ id: 'order-1' });
    orders.findOneOrFail.mockResolvedValue(current);

    await expect(
      service.addItem('order-1', { menuItemId: 'menu-1', quantity: 1 }, actor),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('restores inventory when reducing an item quantity', async () => {
    const stock = { id: 'stock-1', name: 'Carne', quantity: 4, unitCost: 50 };
    const item = {
      id: 'item-1',
      menuItem: { id: 'menu-1' },
      quantity: 3,
      unitPrice: 10,
      subtotal: 30,
    };
    const current = {
      id: 'order-1',
      status: OrderStatus.PENDING,
      createdBy: actor,
      items: [item],
      total: 30,
    };
    const updated = { ...current, total: 10 };
    orders.findOne.mockResolvedValue({ id: 'order-1' });
    orders.findOneOrFail
      .mockResolvedValueOnce(current)
      .mockResolvedValueOnce(updated);
    recipes.find.mockResolvedValue([{ quantity: 0.5, inventoryItem: stock }]);
    inventory.findOne.mockResolvedValue(stock);
    entries.create.mockImplementation((value: unknown) => value);
    items.find.mockResolvedValue([item]);

    const result = await service.updateItem(
      'order-1',
      'item-1',
      { quantity: 1 },
      actor,
    );

    expect(stock.quantity).toBe(5);
    expect(entries.create).toHaveBeenCalledWith(
      expect.objectContaining({ performedBy: actor, unitCost: 50 }),
    );
    expect(current.total).toBe(10);
    expect(result).toBe(updated);
    expect(entries.save).toHaveBeenCalled();
  });
});
