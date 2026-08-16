import 'reflect-metadata';
import {
  In,
  type EntityManager,
  type ObjectLiteral,
  type Repository,
} from 'typeorm';
import dataSource from '../shared/infra/database/typeorm.datasource';
import { CashSessionEntity } from '../core/entities/cash-session.entity';
import { InventoryEntryEntity } from '../core/entities/inventory-entry.entity';
import { InventoryItemEntity } from '../core/entities/inventory-item.entity';
import { InventoryOutputEntity } from '../core/entities/inventory-output.entity';
import { KitchenOrderEntity } from '../core/entities/kitchen-order.entity';
import { MenuItemEntity } from '../core/entities/menu-item.entity';
import { OrderItemEntity } from '../core/entities/order-item.entity';
import { OrderEntity } from '../core/entities/order.entity';
import { PaymentEntity } from '../core/entities/payment.entity';
import { RecipeItemEntity } from '../core/entities/recipe-item.entity';
import { ReservationEntity } from '../core/entities/reservation.entity';
import { RoleEntity } from '../core/entities/role.entity';
import { TableEntity } from '../core/entities/table.entity';
import { UserEntity } from '../core/entities/user.entity';
import { hashPassword } from '../shared/utils/hash.util';
import { classifyDemoDataset, getDemoSeedConfig } from './demo/demo.config';
import { buildDemoScenario } from './demo/demo.data';

type Identified = { id: string };

async function countIds<T extends ObjectLiteral & Identified>(
  repository: Repository<T>,
  ids: string[],
) {
  return repository.countBy({ id: In(ids) } as never);
}

async function assertNoBusinessCollisions(
  manager: EntityManager,
  scenario: ReturnType<typeof buildDemoScenario>,
) {
  const [users, tables, inventory, menu] = await Promise.all([
    manager.getRepository(UserEntity).findBy({
      email: In(scenario.users.map((user) => user.email)),
    }),
    manager.getRepository(TableEntity).findBy({
      number: In(scenario.tables.map((table) => table.number)),
    }),
    manager.getRepository(InventoryItemEntity).findBy({
      name: In(scenario.inventory.map((item) => item.name)),
    }),
    manager.getRepository(MenuItemEntity).findBy({
      name: In(scenario.menu.map((item) => item.name)),
    }),
  ]);
  if (users.length || tables.length || inventory.length || menu.length) {
    throw new Error(
      'Seed demo cancelado: existen emails, números de mesa o nombres reservados por datos no identificados como demo',
    );
  }
}

async function assertExistingDemoIdentity(
  manager: EntityManager,
  scenario: ReturnType<typeof buildDemoScenario>,
) {
  const [users, tables, inventory, menu] = await Promise.all([
    manager.getRepository(UserEntity).findBy({
      id: In(scenario.users.map((user) => user.id)),
    }),
    manager.getRepository(TableEntity).findBy({
      id: In(scenario.tables.map((table) => table.id)),
    }),
    manager.getRepository(InventoryItemEntity).findBy({
      id: In(scenario.inventory.map((item) => item.id)),
    }),
    manager.getRepository(MenuItemEntity).findBy({
      id: In(scenario.menu.map((item) => item.id)),
    }),
  ]);
  const expectedUsers = new Map(
    scenario.users.map((item) => [item.id, item.email]),
  );
  const expectedTables = new Map(
    scenario.tables.map((item) => [item.id, item.number]),
  );
  const expectedInventory = new Map(
    scenario.inventory.map((item) => [item.id, item.name]),
  );
  const expectedMenu = new Map(
    scenario.menu.map((item) => [item.id, item.name]),
  );
  const valid =
    users.every((item) => expectedUsers.get(item.id) === item.email) &&
    tables.every((item) => expectedTables.get(item.id) === item.number) &&
    inventory.every((item) => expectedInventory.get(item.id) === item.name) &&
    menu.every((item) => expectedMenu.get(item.id) === item.name);
  if (!valid) {
    throw new Error(
      'Seed demo cancelado: un UUID demo pertenece a datos inesperados',
    );
  }
}

async function persistScenario(
  manager: EntityManager,
  scenario: ReturnType<typeof buildDemoScenario>,
  passwordHash: string,
) {
  const roleNames = ['kitchen', 'waiter', 'host'];
  const roles = await manager.getRepository(RoleEntity).findBy({
    name: In(roleNames),
  });
  const rolesByName = new Map(roles.map((role) => [role.name, role]));
  const missingRoles = roleNames.filter((name) => !rolesByName.has(name));
  if (missingRoles.length) {
    throw new Error(`Faltan roles estructurales: ${missingRoles.join(', ')}`);
  }

  const group = <T extends ObjectLiteral & Identified>(
    repository: Repository<T>,
    records: Identified[],
  ) => ({
    repository: repository as Repository<ObjectLiteral & Identified>,
    ids: records.map((record) => record.id),
  });
  const repositories = [
    group(manager.getRepository(UserEntity), scenario.users),
    group(manager.getRepository(TableEntity), scenario.tables),
    group(manager.getRepository(InventoryItemEntity), scenario.inventory),
    group(manager.getRepository(MenuItemEntity), scenario.menu),
    group(manager.getRepository(RecipeItemEntity), scenario.recipes),
    group(manager.getRepository(OrderEntity), scenario.orders),
    group(
      manager.getRepository(OrderItemEntity),
      scenario.orders.flatMap((order) => order.items),
    ),
    group(manager.getRepository(KitchenOrderEntity), scenario.kitchenOrders),
    group(manager.getRepository(CashSessionEntity), scenario.sessions),
    group(manager.getRepository(PaymentEntity), scenario.payments),
    group(manager.getRepository(InventoryEntryEntity), scenario.entries),
    group(manager.getRepository(InventoryOutputEntity), scenario.outputs),
    group(manager.getRepository(ReservationEntity), scenario.reservations),
  ];
  const counts = await Promise.all(
    repositories.map(({ repository, ids }) => countIds(repository, ids)),
  );
  const expectedCounts = repositories.map(({ ids }) => ids.length);
  const datasetState = classifyDemoDataset(counts, expectedCounts);
  if (datasetState === 'complete') {
    await assertExistingDemoIdentity(manager, scenario);
    return false;
  }
  await assertNoBusinessCollisions(manager, scenario);

  const usersRepo = manager.getRepository(UserEntity);
  const savedUsers = await usersRepo.save(
    scenario.users.map((user) =>
      usersRepo.create({
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        passwordHash,
        isActive: true,
        role: rolesByName.get(user.role),
      }),
    ),
  );
  const usersByKey = new Map(
    scenario.users.map((user) => [
      user.key,
      savedUsers.find((saved) => saved.id === user.id)!,
    ]),
  );

  const tablesRepo = manager.getRepository(TableEntity);
  const savedTables = await tablesRepo.save(
    scenario.tables.map((table) => tablesRepo.create(table)),
  );
  const tablesByNumber = new Map(
    savedTables.map((table) => [table.number, table]),
  );

  const inventoryRepo = manager.getRepository(InventoryItemEntity);
  const savedInventory = await inventoryRepo.save(
    scenario.inventory.map((item) => inventoryRepo.create(item)),
  );
  const inventoryByKey = new Map(
    scenario.inventory.map((item) => [
      item.key,
      savedInventory.find((saved) => saved.id === item.id)!,
    ]),
  );

  const menuRepo = manager.getRepository(MenuItemEntity);
  const savedMenu = await menuRepo.save(
    scenario.menu.map((item) => menuRepo.create(item)),
  );
  const menuByKey = new Map(
    scenario.menu.map((item) => [
      item.key,
      savedMenu.find((saved) => saved.id === item.id)!,
    ]),
  );

  const recipeRepo = manager.getRepository(RecipeItemEntity);
  await recipeRepo.save(
    scenario.recipes.map((recipe) =>
      recipeRepo.create({
        id: recipe.id,
        menuItem: menuByKey.get(recipe.menuKey),
        inventoryItem: inventoryByKey.get(recipe.inventoryKey),
        quantity: recipe.quantity,
      }),
    ),
  );

  const orderRepo = manager.getRepository(OrderEntity);
  const savedOrders = await orderRepo.save(
    scenario.orders.map((order) =>
      orderRepo.create({
        id: order.id,
        table: tablesByNumber.get(order.tableNumber),
        createdBy: usersByKey.get(order.waiterKey),
        status: order.status,
        total: order.total,
        createdAt: order.createdAt,
        updatedAt: order.updatedAt,
        items: [],
      }),
    ),
  );
  const ordersById = new Map(savedOrders.map((order) => [order.id, order]));
  const orderItemsRepo = manager.getRepository(OrderItemEntity);
  await orderItemsRepo.save(
    scenario.orders.flatMap((order) =>
      order.items.map((item) =>
        orderItemsRepo.create({
          id: item.id,
          order: ordersById.get(order.id),
          menuItem: menuByKey.get(item.menuKey),
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          subtotal: item.subtotal,
          unitCost: item.unitCost,
          costTracked: item.costTracked,
        }),
      ),
    ),
  );

  const kitchenRepo = manager.getRepository(KitchenOrderEntity);
  await kitchenRepo.save(
    scenario.kitchenOrders.map((ticket) =>
      kitchenRepo.create({
        id: ticket.id,
        order: ordersById.get(ticket.orderId),
        status: ticket.status,
        createdAt: ticket.createdAt,
        updatedAt: ticket.updatedAt,
      }),
    ),
  );

  const sessionsRepo = manager.getRepository(CashSessionEntity);
  const savedSessions = await sessionsRepo.save(
    scenario.sessions.map((session) =>
      sessionsRepo.create({
        id: session.id,
        openedBy: usersByKey.get(session.waiterKey),
        openingBalance: session.openingBalance,
        expectedBalance: session.expectedBalance,
        closingBalance: session.closingBalance,
        difference: session.difference,
        status: session.status,
        openedAt: session.openedAt,
        closedAt: session.closedAt,
      }),
    ),
  );
  const sessionsById = new Map(
    savedSessions.map((session) => [session.id, session]),
  );

  const paymentsRepo = manager.getRepository(PaymentEntity);
  await paymentsRepo.save(
    scenario.payments.map((payment) =>
      paymentsRepo.create({
        id: payment.id,
        order: ordersById.get(payment.orderId),
        createdBy: usersByKey.get(payment.waiterKey),
        cashSession: sessionsById.get(payment.cashSessionId),
        amount: payment.amount,
        receivedAmount: payment.receivedAmount,
        changeAmount: payment.changeAmount,
        method: payment.method,
        createdAt: payment.createdAt,
      }),
    ),
  );

  const entriesRepo = manager.getRepository(InventoryEntryEntity);
  await entriesRepo.save(
    scenario.entries.map((entry) =>
      entriesRepo.create({
        id: entry.id,
        item: inventoryByKey.get(entry.inventoryKey),
        quantity: entry.quantity,
        unitCost: entry.unitCost,
        performedBy: usersByKey.get(entry.waiterKey),
        note: entry.note,
        createdAt: entry.createdAt,
        updatedAt: entry.updatedAt ?? entry.createdAt,
      }),
    ),
  );
  const outputsRepo = manager.getRepository(InventoryOutputEntity);
  await outputsRepo.save(
    scenario.outputs.map((output) =>
      outputsRepo.create({
        id: output.id,
        item: inventoryByKey.get(output.inventoryKey),
        quantity: output.quantity,
        unitCost: output.unitCost,
        reason: output.reason,
        performedBy: usersByKey.get(output.waiterKey),
        note: output.note,
        createdAt: output.createdAt,
        updatedAt: output.updatedAt ?? output.createdAt,
      }),
    ),
  );

  const reservationsRepo = manager.getRepository(ReservationEntity);
  await reservationsRepo.save(
    scenario.reservations.map((reservation) =>
      reservationsRepo.create({
        id: reservation.id,
        table: tablesByNumber.get(reservation.tableNumber),
        customerName: reservation.customerName,
        phone: reservation.phone,
        email: reservation.email,
        guests: reservation.guests,
        reservationAt: reservation.reservationAt,
        status: reservation.status,
        note: reservation.note,
        createdAt: reservation.createdAt,
        updatedAt: reservation.updatedAt,
      }),
    ),
  );
  return true;
}

export async function runDemoSeed() {
  const config = getDemoSeedConfig();
  const scenario = buildDemoScenario();
  const passwordHash = await hashPassword(config.password);
  await dataSource.initialize();
  try {
    const inserted = await dataSource.transaction((manager) =>
      persistScenario(manager, scenario, passwordHash),
    );
    if (!inserted) {
      console.log('Dataset demo ya existente; no se realizaron cambios.');
      return;
    }
    console.log('Dataset demo Urban Burger & Grill creado correctamente.');
    console.log(
      JSON.stringify({
        users: scenario.users.length,
        tables: scenario.tables.length,
        inventoryItems: scenario.inventory.length,
        inventoryEntries: scenario.entries.length,
        inventoryOutputs: scenario.outputs.length,
        menuItems: scenario.menu.length,
        recipeItems: scenario.recipes.length,
        orders: scenario.orders.length,
        orderItems: scenario.orders.flatMap((order) => order.items).length,
        kitchenOrders: scenario.kitchenOrders.length,
        payments: scenario.payments.length,
        cashSessions: scenario.sessions.length,
        reservations: scenario.reservations.length,
      }),
    );
  } finally {
    await dataSource.destroy();
  }
}

if (require.main === module) {
  void runDemoSeed().catch((error: unknown) => {
    const message =
      error instanceof Error ? error.message : 'Error desconocido';
    console.error(`No se pudo cargar el dataset demo: ${message}`);
    process.exitCode = 1;
  });
}
