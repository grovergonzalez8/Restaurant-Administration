import { NestFactory } from '@nestjs/core';
import { DataSource } from 'typeorm';
import { AppModule } from '../app.module';
import { InventoryEntryEntity } from '../core/entities/inventory-entry.entity';
import { InventoryItemEntity } from '../core/entities/inventory-item.entity';
import { KitchenOrderEntity } from '../core/entities/kitchen-order.entity';
import { MenuItemEntity } from '../core/entities/menu-item.entity';
import { OrderEntity } from '../core/entities/order.entity';
import { TableEntity } from '../core/entities/table.entity';
import { UserEntity } from '../core/entities/user.entity';
import { RecipeItemEntity } from '../core/entities/recipe-item.entity';
import { KitchenStatus } from '../core/enums/kitchen-status.enum';
import { MenuStatus } from '../core/enums/menu-status.enum';
import { OrderStatus } from '../core/enums/order-status.enum';
import { TableStatus } from '../core/enums/table-status.enum';
import { seedRoles } from './roles.seed';
import { seedUsers } from './users.seed';

const menuSeedItems = [
  {
    name: 'Brocheta de Pollo 3D (Demo)',
    description: 'Brocheta de pollo a la parrilla. El modelo 3D representa una brocheta de comida.',
    price: 42,
    status: MenuStatus.AVAIBLE,
    imageUrl: 'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=900&q=80',
    model3dUrl: 'https://modelviewer.dev/shared-assets/models/shishkebab.glb',
  },
  {
    name: 'Plato con Aceitunas 3D (Demo)',
    description: 'Plato de aceitunas para la demostración del visor 3D.',
    price: 28,
    status: MenuStatus.AVAIBLE,
    imageUrl: 'https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?auto=format&fit=crop&w=900&q=80',
    model3dUrl: 'https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Assets/main/Models/IridescentDishWithOlives/glTF-Binary/IridescentDishWithOlives.glb',
  },
  {
    name: 'Aguacate Fresco 3D (Demo)',
    description: 'Aguacate fresco. El modelo 3D representa un aguacate.',
    price: 18,
    status: MenuStatus.AVAIBLE,
    imageUrl: 'https://images.unsplash.com/photo-1523049673857-eb18f1d7b578?auto=format&fit=crop&w=900&q=80',
    model3dUrl: 'https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Assets/main/Models/Avocado/glTF-Binary/Avocado.glb',
  },
  {
    name: 'Pescado Barramundi 3D (Demo)',
    description: 'Pescado barramundi. El modelo 3D representa el pescado completo.',
    price: 64,
    status: MenuStatus.AVAIBLE,
    imageUrl: 'https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2?auto=format&fit=crop&w=900&q=80',
    model3dUrl: 'https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Assets/main/Models/BarramundiFish/glTF-Binary/BarramundiFish.glb',
  },
  {
    name: 'Taza de Té 3D (Demo)',
    description: 'Taza de té para probar un modelo 3D de bebida.',
    price: 15,
    status: MenuStatus.AVAIBLE,
    imageUrl: 'https://images.unsplash.com/photo-1544787219-7f47ccb76574?auto=format&fit=crop&w=900&q=80',
    model3dUrl: 'https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Assets/main/Models/DiffuseTransmissionTeacup/glTF-Binary/DiffuseTransmissionTeacup.glb',
  },
  {
    name: 'Brocheta de Carne 3D (Demo)',
    description: 'Brocheta de carne a la parrilla. El modelo 3D representa una brocheta de comida.',
    price: 46,
    status: MenuStatus.AVAIBLE,
    imageUrl: 'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=900&q=80',
    model3dUrl: 'https://modelviewer.dev/shared-assets/models/shishkebab.glb',
  },
  {
    name: 'Plato Gourmet con Aceitunas 3D (Demo)',
    description: 'Plato gourmet con aceitunas para una segunda demostración 3D.',
    price: 32,
    status: MenuStatus.AVAIBLE,
    imageUrl: 'https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?auto=format&fit=crop&w=900&q=80',
    model3dUrl: 'https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Assets/main/Models/IridescentDishWithOlives/glTF-Binary/IridescentDishWithOlives.glb',
  },
  {
    name: 'Taza de Té con Leche 3D (Demo)',
    description: 'Taza de té con leche para una segunda demostración 3D de bebida.',
    price: 17,
    status: MenuStatus.AVAIBLE,
    imageUrl: 'https://images.unsplash.com/photo-1544787219-7f47ccb76574?auto=format&fit=crop&w=900&q=80',
    model3dUrl: 'https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Assets/main/Models/DiffuseTransmissionTeacup/glTF-Binary/DiffuseTransmissionTeacup.glb',
  },
];

const legacyMenuItemNames = [
  'Hamburguesa Clásica',
  'Pizza Pepperoni',
  'Pasta Alfredo',
  'Ensalada César',
  'Lomo a la Plancha',
  'Limonada de Hierbabuena',
  'Brownie con Helado',
  'Plato de Aceitunas 3D (Demo)',
];

const inventorySeedItems = [
  { name: 'Carne de res', unit: 'kg', quantity: 18, description: 'Carne para brochetas' },
  { name: 'Pechuga de pollo', unit: 'kg', quantity: 14, description: 'Pollo fresco para brochetas' },
  { name: 'Aceitunas', unit: 'kg', quantity: 6, description: 'Aceitunas para los platos de demostración' },
  { name: 'Aguacate', unit: 'kg', quantity: 10, description: 'Aguacate fresco' },
  { name: 'Pescado barramundi', unit: 'kg', quantity: 12, description: 'Pescado fresco' },
  { name: 'Té negro', unit: 'g', quantity: 800, description: 'Té para las bebidas de demostración' },
  { name: 'Leche', unit: 'l', quantity: 15, description: 'Leche para las bebidas de demostración' },
];

const legacyInventoryItemNames = [
  'Carne molida',
  'Pechuga de pollo',
  'Queso mozzarella',
  'Papas',
  'Limón',
  'Harina',
  undefined,
];

async function seedDatabase() {
  const app = await NestFactory.createApplicationContext(AppModule);
  try {
    await seedRoles(app);
    await seedUsers(app);
    const db = app.get(DataSource);
    const tables = db.getRepository(TableEntity);
    const menu = db.getRepository(MenuItemEntity);
    const inventory = db.getRepository(InventoryItemEntity);
    const entries = db.getRepository(InventoryEntryEntity);
    const orders = db.getRepository(OrderEntity);
    const kitchen = db.getRepository(KitchenOrderEntity);
    const recipes = db.getRepository(RecipeItemEntity);

    if (!(await tables.count())) {
      await tables.save([
        { number: 1, capacity: 2, status: TableStatus.OCCUPIED },
        { number: 2, capacity: 2, status: TableStatus.FREE },
        { number: 3, capacity: 4, status: TableStatus.OCCUPIED },
        { number: 4, capacity: 4, status: TableStatus.RESERVED },
        { number: 5, capacity: 6, status: TableStatus.FREE },
        { number: 6, capacity: 6, status: TableStatus.FREE },
        { number: 7, capacity: 8, status: TableStatus.FREE },
        { number: 8, capacity: 8, status: TableStatus.OUT_OF_SERVICE },
      ]);
    }

    for (const [index, menuSeedItem] of menuSeedItems.entries()) {
      const existingItem = await menu.findOneBy({ name: menuSeedItem.name })
        ?? await menu.findOneBy({ name: legacyMenuItemNames[index] });

      if (existingItem) {
        await menu.save({ ...existingItem, ...menuSeedItem });
      } else {
        await menu.save(menuSeedItem);
      }
    }

    for (const [index, inventorySeedItem] of inventorySeedItems.entries()) {
      const legacyInventoryItemName = legacyInventoryItemNames[index];
      const existingItem = await inventory.findOneBy({ name: inventorySeedItem.name })
        ?? (legacyInventoryItemName
          ? await inventory.findOneBy({ name: legacyInventoryItemName })
          : null);

      if (existingItem) {
        await inventory.save({ ...existingItem, ...inventorySeedItem });
      } else {
        const savedItem = await inventory.save(inventorySeedItem);
        await entries.save(entries.create({
          item: savedItem,
          quantity: savedItem.quantity,
          note: 'Inventario inicial de demo',
        }));
      }
    }

    const seededMenuItems = await menu.find();
    const seededMenuItemIds = seededMenuItems
      .filter((item) => menuSeedItems.some((seedItem) => seedItem.name === item.name))
      .map((item) => item.id);

    if (seededMenuItemIds.length) {
      await recipes.createQueryBuilder()
        .delete()
        .where('"menuItemId" IN (:...seededMenuItemIds)', { seededMenuItemIds })
        .execute();
    }

    const ingredient = async (name: string) => inventory.findOneByOrFail({ name });
    const product = async (name: string) => menu.findOneByOrFail({ name });
    await recipes.save([
      { menuItem: await product('Brocheta de Pollo 3D (Demo)'), inventoryItem: await ingredient('Pechuga de pollo'), quantity: 0.2 },
      { menuItem: await product('Plato con Aceitunas 3D (Demo)'), inventoryItem: await ingredient('Aceitunas'), quantity: 0.15 },
      { menuItem: await product('Aguacate Fresco 3D (Demo)'), inventoryItem: await ingredient('Aguacate'), quantity: 0.2 },
      { menuItem: await product('Pescado Barramundi 3D (Demo)'), inventoryItem: await ingredient('Pescado barramundi'), quantity: 0.3 },
      { menuItem: await product('Taza de Té 3D (Demo)'), inventoryItem: await ingredient('Té negro'), quantity: 0.01 },
      { menuItem: await product('Brocheta de Carne 3D (Demo)'), inventoryItem: await ingredient('Carne de res'), quantity: 0.2 },
      { menuItem: await product('Plato Gourmet con Aceitunas 3D (Demo)'), inventoryItem: await ingredient('Aceitunas'), quantity: 0.2 },
      { menuItem: await product('Taza de Té con Leche 3D (Demo)'), inventoryItem: await ingredient('Té negro'), quantity: 0.01 },
      { menuItem: await product('Taza de Té con Leche 3D (Demo)'), inventoryItem: await ingredient('Leche'), quantity: 0.2 },
    ]);

    if (!(await orders.count())) {
      const [table1, table3] = await tables.find({ order: { number: 'ASC' }, take: 3 });
      const products = await menu.find({ order: { name: 'ASC' } });
      const waiter = await db.getRepository(UserEntity).findOne({ where: { email: 'waiter@restaurant.test' } });
      const makeOrder = (table: TableEntity, selected: MenuItemEntity[], status: OrderStatus) => {
        const items = selected.map((product, index) => ({ menuItem: product, quantity: index + 1, unitPrice: product.price, subtotal: product.price * (index + 1) }));
        return orders.create({ table, createdBy: waiter ?? undefined, status, items, total: items.reduce((sum, item) => sum + item.subtotal, 0) });
      };
      const saved = await orders.save([
        makeOrder(table1, [products[0], products[3]], OrderStatus.IN_PROGRESS),
        makeOrder(table3, [products[1], products[5]], OrderStatus.PENDING),
      ]);
      await kitchen.save([
        kitchen.create({ order: saved[0], status: KitchenStatus.IN_PROGRESS }),
        kitchen.create({ order: saved[1], status: KitchenStatus.PENDING }),
      ]);
    }
    console.log('Datos demo cargados correctamente.');
  } finally {
    await app.close();
  }
}

seedDatabase().catch((error) => {
  console.error('No se pudieron cargar los datos demo:', error);
  process.exitCode = 1;
});
