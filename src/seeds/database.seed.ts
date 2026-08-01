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
import { KitchenStatus } from '../core/enums/kitchen-status.enum';
import { MenuStatus } from '../core/enums/menu-status.enum';
import { OrderStatus } from '../core/enums/order-status.enum';
import { TableStatus } from '../core/enums/table-status.enum';
import { seedRoles } from './roles.seed';
import { seedUsers } from './users.seed';

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

    if (!(await menu.count())) {
      await menu.save([
        { name: 'Hamburguesa Clásica', description: 'Carne artesanal, cheddar, lechuga, tomate y salsa de la casa.', price: 42, status: MenuStatus.AVAIBLE, imageUrl: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=900&q=80' },
        { name: 'Pizza Pepperoni', description: 'Masa artesanal, mozzarella, salsa pomodoro y pepperoni.', price: 58, status: MenuStatus.AVAIBLE, imageUrl: 'https://images.unsplash.com/photo-1628840042765-356cda07504e?auto=format&fit=crop&w=900&q=80' },
        { name: 'Pasta Alfredo', description: 'Fettuccine en salsa cremosa de parmesano y pollo.', price: 49, status: MenuStatus.AVAIBLE, imageUrl: 'https://images.unsplash.com/photo-1645112411341-6c4fd023714a?auto=format&fit=crop&w=900&q=80' },
        { name: 'Ensalada César', description: 'Lechuga romana, pollo grillado, crutones y parmesano.', price: 36, status: MenuStatus.AVAIBLE, imageUrl: 'https://images.unsplash.com/photo-1546793665-c74683f339c1?auto=format&fit=crop&w=900&q=80' },
        { name: 'Lomo a la Plancha', description: 'Lomo de res con papas rústicas y vegetales salteados.', price: 74, status: MenuStatus.AVAIBLE, imageUrl: 'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=900&q=80' },
        { name: 'Limonada de Hierbabuena', description: 'Limonada natural con hierbabuena fresca.', price: 15, status: MenuStatus.AVAIBLE, imageUrl: 'https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?auto=format&fit=crop&w=900&q=80' },
        { name: 'Brownie con Helado', description: 'Brownie tibio de chocolate con helado de vainilla.', price: 24, status: MenuStatus.AVAIBLE, imageUrl: 'https://images.unsplash.com/photo-1564355808539-22fda35bed7e?auto=format&fit=crop&w=900&q=80' },
      ]);
    }

    if (!(await inventory.count())) {
      const items = await inventory.save([
        { name: 'Carne molida', unit: 'kg', quantity: 18, description: 'Carne de res para hamburguesas' },
        { name: 'Queso mozzarella', unit: 'kg', quantity: 12, description: 'Queso para pizzas y pastas' },
        { name: 'Pechuga de pollo', unit: 'kg', quantity: 14, description: 'Pollo fresco' },
        { name: 'Papas', unit: 'kg', quantity: 30, description: 'Papas para guarnición' },
        { name: 'Limón', unit: 'kg', quantity: 10, description: 'Limón fresco para bebidas' },
        { name: 'Harina', unit: 'kg', quantity: 25, description: 'Harina para masas' },
      ]);
      await entries.save(items.map((item) => entries.create({ item, quantity: item.quantity, note: 'Inventario inicial de demo' })));
    }

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
