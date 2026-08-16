import { CashSessionStatus } from '../../core/enums/cash-session-status.enum';
import { InventoryOutputReason } from '../../core/enums/inventory-output-reason.enum';
import { KitchenStatus } from '../../core/enums/kitchen-status.enum';
import { MenuStatus } from '../../core/enums/menu-status.enum';
import { OrderStatus } from '../../core/enums/order-status.enum';
import { PaymentMethod } from '../../core/enums/payment-method.enum';
import { ReservationStatus } from '../../core/enums/reservation-status.enum';
import { TableStatus } from '../../core/enums/table-status.enum';

export const DEMO_MARKER = 'Urban Burger & Grill demo';

const demoUuid = (group: number, index: number) =>
  `d3e00000-${group.toString(16).padStart(4, '0')}-4000-8000-${index
    .toString(16)
    .padStart(12, '0')}`;
const round2 = (value: number) =>
  Math.round((value + Number.EPSILON) * 100) / 100;
const round4 = (value: number) =>
  Math.round((value + Number.EPSILON) * 10000) / 10000;
const atUtc = (now: Date, dayDelta: number, hour: number, minute = 0) => {
  const date = new Date(now);
  date.setUTCDate(date.getUTCDate() + dayDelta);
  date.setUTCHours(hour, minute, 0, 0);
  return date;
};

export type DemoUser = {
  id: string;
  key: string;
  name: string;
  email: string;
  phone: string;
  role: 'kitchen' | 'waiter' | 'host';
};

export type DemoInventoryItem = {
  id: string;
  key: string;
  name: string;
  description: string;
  unit: 'kg' | 'l' | 'unidad';
  unitCost: number;
  minStock: number;
  quantity: number;
};

export type DemoMenuItem = {
  id: string;
  key: string;
  name: string;
  description: string;
  price: number;
  status: MenuStatus;
};

export type DemoRecipeItem = {
  id: string;
  menuKey: string;
  inventoryKey: string;
  quantity: number;
};

export type DemoOrderItem = {
  id: string;
  menuKey: string;
  quantity: number;
  unitPrice: number;
  subtotal: number;
  unitCost: number;
  costTracked: boolean;
};

export type DemoOrder = {
  id: string;
  tableNumber: number;
  waiterKey: string;
  status: OrderStatus;
  total: number;
  createdAt: Date;
  updatedAt: Date;
  items: DemoOrderItem[];
};

export type DemoCashSession = {
  id: string;
  waiterKey: string;
  openingBalance: number;
  expectedBalance?: number;
  closingBalance?: number;
  difference?: number;
  status: CashSessionStatus;
  openedAt: Date;
  closedAt?: Date;
};

export type DemoPayment = {
  id: string;
  orderId: string;
  waiterKey: string;
  cashSessionId: string;
  amount: number;
  receivedAmount: number | null;
  changeAmount: number | null;
  method: PaymentMethod;
  createdAt: Date;
};

export type DemoInventoryMovement = {
  id: string;
  inventoryKey: string;
  quantity: number;
  unitCost: number;
  reason?: InventoryOutputReason;
  waiterKey: string;
  note: string;
  createdAt: Date;
  updatedAt?: Date;
};

export type DemoScenario = ReturnType<typeof buildDemoScenario>;

const users: DemoUser[] = [
  {
    id: demoUuid(1, 1),
    key: 'kitchen',
    name: 'Camila Rojas',
    email: 'kitchen.demo@urbanburger.invalid',
    phone: '+59170001001',
    role: 'kitchen',
  },
  {
    id: demoUuid(1, 2),
    key: 'waiter-1',
    name: 'Mateo Vargas',
    email: 'waiter1.demo@urbanburger.invalid',
    phone: '+59170001002',
    role: 'waiter',
  },
  {
    id: demoUuid(1, 3),
    key: 'waiter-2',
    name: 'Valentina Cruz',
    email: 'waiter2.demo@urbanburger.invalid',
    phone: '+59170001003',
    role: 'waiter',
  },
  {
    id: demoUuid(1, 4),
    key: 'host',
    name: 'Sofía Mendoza',
    email: 'host.demo@urbanburger.invalid',
    phone: '+59170001004',
    role: 'host',
  },
];

const tables = [2, 2, 4, 4, 4, 4, 6, 6, 6, 8, 8, 8].map((capacity, index) => ({
  id: demoUuid(2, index + 1),
  number: index + 1,
  capacity,
  status:
    index + 1 === 12
      ? TableStatus.OUT_OF_SERVICE
      : index + 1 === 8
        ? TableStatus.RESERVED
        : [1, 3, 5].includes(index + 1)
          ? TableStatus.OCCUPIED
          : TableStatus.FREE,
}));

const inventoryDefinitions = [
  [
    'beef',
    'Carne vacuna',
    'Carne molida 80/20 para hamburguesas',
    'kg',
    58,
    4,
    11,
  ],
  [
    'chicken',
    'Pechuga de pollo',
    'Pechuga fresca para crispy chicken',
    'kg',
    32,
    3,
    8,
  ],
  [
    'veggie',
    'Medallón veggie',
    'Medallón vegetal refrigerado',
    'unidad',
    8.5,
    10,
    22,
  ],
  ['bun', 'Pan brioche', 'Pan brioche artesanal', 'unidad', 2.5, 20, 46],
  ['cheddar', 'Cheddar', 'Láminas de queso cheddar', 'unidad', 1.8, 25, 58],
  ['bacon', 'Bacon', 'Bacon ahumado', 'kg', 70, 1.5, 1.2],
  ['lettuce', 'Lechuga', 'Lechuga fresca lavada', 'kg', 15, 1, 2.4],
  ['tomato', 'Tomate', 'Tomate fresco en rodajas', 'kg', 12, 2, 4.5],
  ['onion', 'Cebolla', 'Cebolla blanca y morada', 'kg', 8, 2, 5],
  ['pickles', 'Pepinillos', 'Pepinillos encurtidos', 'kg', 22, 1, 2.2],
  ['potato', 'Papa', 'Papa seleccionada para fritura', 'kg', 9, 8, 21],
  [
    'rings',
    'Aros de cebolla',
    'Aros de cebolla empanizados congelados',
    'kg',
    28,
    3,
    7,
  ],
  ['oil', 'Aceite vegetal', 'Aceite para fritura', 'l', 16, 5, 12],
  ['mayo', 'Mayonesa', 'Mayonesa para salsas y montaje', 'kg', 24, 2, 4],
  ['ketchup', 'Ketchup', 'Ketchup de tomate', 'kg', 18, 2, 4],
  ['mustard', 'Mostaza', 'Mostaza amarilla', 'kg', 20, 1, 2.5],
  ['bbq', 'Salsa BBQ', 'Salsa BBQ ahumada', 'kg', 28, 1, 2.6],
  [
    'burger-sauce',
    'Salsa burger',
    'Salsa especial de la casa',
    'kg',
    30,
    1,
    2.8,
  ],
  [
    'butter',
    'Mantequilla',
    'Mantequilla para plancha y panes',
    'kg',
    38,
    1,
    2.3,
  ],
  ['flour', 'Harina', 'Harina de trigo para rebozado', 'kg', 10, 2, 5],
  ['panko', 'Panko', 'Pan rallado japonés', 'kg', 24, 1, 2.5],
  ['coke', 'Coca-Cola', 'Botella individual refrigerada', 'unidad', 5, 12, 30],
  ['sprite', 'Sprite', 'Botella individual refrigerada', 'unidad', 5, 12, 10],
  [
    'water-bottle',
    'Agua embotellada',
    'Botella individual sin gas',
    'unidad',
    3,
    12,
    28,
  ],
  [
    'filtered-water',
    'Agua filtrada',
    'Agua para bebidas preparadas',
    'l',
    1,
    5,
    15,
  ],
  ['lemon', 'Limón', 'Limón fresco para limonada', 'kg', 14, 2, 5],
  ['sugar', 'Azúcar', 'Azúcar blanca', 'kg', 8, 2, 4],
  ['brownie', 'Brownie', 'Porción de brownie horneado', 'unidad', 6.5, 8, 18],
  [
    'ice-cream',
    'Helado de vainilla',
    'Helado artesanal de vainilla',
    'kg',
    30,
    2,
    3.5,
  ],
  [
    'cheesecake',
    'Cheesecake',
    'Porción de cheesecake refrigerado',
    'unidad',
    8,
    8,
    6,
  ],
  ['cream', 'Crema', 'Crema para acompañamientos y postres', 'kg', 25, 1, 2.2],
] as const;

const inventoryBase = inventoryDefinitions.map((item, index) => ({
  id: demoUuid(3, index + 1),
  key: item[0],
  name: item[1],
  description: item[2],
  unit: item[3],
  unitCost: item[4],
  minStock: item[5],
  targetStock: item[6],
}));

const menuDefinitions = [
  [
    'classic',
    'Classic Burger',
    'Hamburguesa · Carne a la plancha, vegetales y salsa de la casa',
    35,
  ],
  ['cheese', 'Cheese Burger', 'Hamburguesa · Classic con doble cheddar', 39],
  [
    'bacon-bbq',
    'Bacon BBQ',
    'Hamburguesa · Carne, cheddar, bacon y salsa BBQ',
    45,
  ],
  [
    'crispy',
    'Crispy Chicken',
    'Hamburguesa · Pollo crocante, vegetales y mayonesa',
    38,
  ],
  [
    'double-smash',
    'Double Smash',
    'Hamburguesa · Doble carne smash, cheddar y salsa burger',
    55,
  ],
  [
    'veggie-burger',
    'Veggie Burger',
    'Hamburguesa · Medallón vegetal, vegetales y mayonesa',
    34,
  ],
  [
    'fries',
    'Papas clásicas',
    'Acompañamiento · Papas doradas y crujientes',
    18,
  ],
  [
    'loaded-fries',
    'Papas con cheddar y bacon',
    'Acompañamiento · Papas, cheddar, bacon y crema',
    28,
  ],
  [
    'onion-rings',
    'Aros de cebolla',
    'Acompañamiento · Aros crocantes con salsa burger',
    22,
  ],
  ['coke', 'Coca-Cola', 'Bebida · Botella individual', 10],
  ['sprite', 'Sprite', 'Bebida · Botella individual', 10],
  ['lemonade', 'Limonada', 'Bebida · Limonada fresca de la casa', 14],
  ['water', 'Agua', 'Bebida · Botella individual sin gas', 7],
  [
    'brownie-dessert',
    'Brownie con helado',
    'Postre · Brownie tibio con helado de vainilla',
    24,
  ],
  ['cheesecake-dessert', 'Cheesecake', 'Postre · Cheesecake con crema', 23],
] as const;

const menu: DemoMenuItem[] = menuDefinitions.map((item, index) => ({
  id: demoUuid(4, index + 1),
  key: item[0],
  name: item[1],
  description: item[2],
  price: item[3],
  status: MenuStatus.AVAIBLE,
}));

const recipeDefinitions: Array<[string, string, number]> = [
  ['classic', 'bun', 1],
  ['classic', 'beef', 0.15],
  ['classic', 'lettuce', 0.03],
  ['classic', 'tomato', 0.04],
  ['classic', 'onion', 0.02],
  ['classic', 'pickles', 0.02],
  ['classic', 'burger-sauce', 0.03],
  ['classic', 'butter', 0.01],
  ['cheese', 'bun', 1],
  ['cheese', 'beef', 0.15],
  ['cheese', 'cheddar', 2],
  ['cheese', 'lettuce', 0.03],
  ['cheese', 'tomato', 0.04],
  ['cheese', 'onion', 0.02],
  ['cheese', 'pickles', 0.02],
  ['cheese', 'burger-sauce', 0.03],
  ['cheese', 'butter', 0.01],
  ['bacon-bbq', 'bun', 1],
  ['bacon-bbq', 'beef', 0.15],
  ['bacon-bbq', 'cheddar', 1],
  ['bacon-bbq', 'bacon', 0.04],
  ['bacon-bbq', 'onion', 0.02],
  ['bacon-bbq', 'pickles', 0.02],
  ['bacon-bbq', 'bbq', 0.04],
  ['bacon-bbq', 'butter', 0.01],
  ['crispy', 'bun', 1],
  ['crispy', 'chicken', 0.16],
  ['crispy', 'flour', 0.03],
  ['crispy', 'panko', 0.04],
  ['crispy', 'lettuce', 0.03],
  ['crispy', 'tomato', 0.04],
  ['crispy', 'mayo', 0.03],
  ['crispy', 'oil', 0.04],
  ['double-smash', 'bun', 1],
  ['double-smash', 'beef', 0.28],
  ['double-smash', 'cheddar', 2],
  ['double-smash', 'onion', 0.03],
  ['double-smash', 'pickles', 0.03],
  ['double-smash', 'burger-sauce', 0.04],
  ['double-smash', 'butter', 0.01],
  ['veggie-burger', 'bun', 1],
  ['veggie-burger', 'veggie', 1],
  ['veggie-burger', 'lettuce', 0.03],
  ['veggie-burger', 'tomato', 0.04],
  ['veggie-burger', 'onion', 0.02],
  ['veggie-burger', 'pickles', 0.02],
  ['veggie-burger', 'mayo', 0.03],
  ['fries', 'potato', 0.25],
  ['fries', 'oil', 0.05],
  ['fries', 'ketchup', 0.03],
  ['loaded-fries', 'potato', 0.25],
  ['loaded-fries', 'oil', 0.05],
  ['loaded-fries', 'cheddar', 2],
  ['loaded-fries', 'bacon', 0.04],
  ['loaded-fries', 'cream', 0.04],
  ['onion-rings', 'rings', 0.2],
  ['onion-rings', 'oil', 0.04],
  ['onion-rings', 'burger-sauce', 0.03],
  ['coke', 'coke', 1],
  ['sprite', 'sprite', 1],
  ['water', 'water-bottle', 1],
  ['lemonade', 'filtered-water', 0.4],
  ['lemonade', 'lemon', 0.12],
  ['lemonade', 'sugar', 0.05],
  ['brownie-dessert', 'brownie', 1],
  ['brownie-dessert', 'ice-cream', 0.08],
  ['brownie-dessert', 'cream', 0.02],
  ['cheesecake-dessert', 'cheesecake', 1],
  ['cheesecake-dessert', 'cream', 0.02],
];

const recipes: DemoRecipeItem[] = recipeDefinitions.map((recipe, index) => ({
  id: demoUuid(5, index + 1),
  menuKey: recipe[0],
  inventoryKey: recipe[1],
  quantity: recipe[2],
}));

const orderTemplates: Array<Array<[string, number]>> = [
  [
    ['classic', 2],
    ['fries', 1],
    ['coke', 2],
  ],
  [
    ['cheese', 1],
    ['crispy', 1],
    ['loaded-fries', 1],
    ['lemonade', 2],
  ],
  [
    ['double-smash', 2],
    ['onion-rings', 1],
    ['sprite', 2],
    ['brownie-dessert', 1],
  ],
  [
    ['veggie-burger', 1],
    ['classic', 1],
    ['fries', 2],
    ['water', 2],
  ],
  [
    ['bacon-bbq', 2],
    ['loaded-fries', 1],
    ['coke', 2],
    ['cheesecake-dessert', 1],
  ],
  [
    ['crispy', 2],
    ['onion-rings', 2],
    ['lemonade', 2],
  ],
  [
    ['double-smash', 1],
    ['cheese', 2],
    ['fries', 2],
    ['sprite', 3],
  ],
  [
    ['classic', 1],
    ['bacon-bbq', 1],
    ['water', 2],
    ['brownie-dessert', 2],
  ],
];

export function buildDemoScenario(now = new Date()) {
  const inventoryCost = new Map<string, number>(
    inventoryBase.map((item) => [item.key, item.unitCost]),
  );
  const menuByKey = new Map(menu.map((item) => [item.key, item]));
  const recipesByMenu = new Map<string, DemoRecipeItem[]>();
  for (const recipe of recipes) {
    recipesByMenu.set(recipe.menuKey, [
      ...(recipesByMenu.get(recipe.menuKey) ?? []),
      recipe,
    ]);
  }
  const menuCost = (menuKey: string) =>
    round4(
      (recipesByMenu.get(menuKey) ?? []).reduce(
        (total, recipe) =>
          total +
          recipe.quantity * (inventoryCost.get(recipe.inventoryKey) ?? 0),
        0,
      ),
    );

  let orderItemIndex = 0;
  const makeOrder = (
    index: number,
    products: Array<[string, number]>,
    tableNumber: number,
    waiterKey: string,
    status: OrderStatus,
    createdAt: Date,
  ): DemoOrder => {
    const items = products.map(([menuKey, quantity]) => {
      const product = menuByKey.get(menuKey);
      if (!product) throw new Error(`Producto demo desconocido: ${menuKey}`);
      const unitCost = menuCost(menuKey);
      return {
        id: demoUuid(7, ++orderItemIndex),
        menuKey,
        quantity,
        unitPrice: product.price,
        subtotal: round2(product.price * quantity),
        unitCost,
        costTracked: (recipesByMenu.get(menuKey) ?? []).length > 0,
      };
    });
    return {
      id: demoUuid(6, index),
      tableNumber,
      waiterKey,
      status,
      total: round2(items.reduce((sum, item) => sum + item.subtotal, 0)),
      createdAt,
      updatedAt: createdAt,
      items,
    };
  };

  const completedOrders: DemoOrder[] = [];
  const sessions: DemoCashSession[] = [];
  const payments: DemoPayment[] = [];
  let orderIndex = 0;
  let paymentIndex = 0;
  for (let day = 1; day <= 8; day += 1) {
    const waiterKey = day % 2 === 0 ? 'waiter-1' : 'waiter-2';
    const sessionId = demoUuid(9, day);
    const dayOrders: DemoOrder[] = [];
    for (let slot = 0; slot < 5; slot += 1) {
      const template = orderTemplates[(day * 3 + slot) % orderTemplates.length];
      const createdAt = atUtc(now, -day, 12 + slot * 2, slot % 2 ? 20 : 5);
      const order = makeOrder(
        ++orderIndex,
        template,
        ((day * 5 + slot * 2) % 11) + 1,
        waiterKey,
        OrderStatus.COMPLETED,
        createdAt,
      );
      dayOrders.push(order);
      completedOrders.push(order);
      const method = [PaymentMethod.CASH, PaymentMethod.QR, PaymentMethod.CARD][
        (day + slot) % 3
      ];
      const paidAt = new Date(createdAt.getTime() + 35 * 60 * 1000);
      const received =
        method === PaymentMethod.CASH ? Math.ceil(order.total / 10) * 10 : null;
      payments.push({
        id: demoUuid(10, ++paymentIndex),
        orderId: order.id,
        waiterKey,
        cashSessionId: sessionId,
        amount: order.total,
        receivedAmount: received,
        changeAmount: received == null ? null : round2(received - order.total),
        method,
        createdAt: paidAt,
      });
    }
    const cashSales = payments
      .filter(
        (payment) =>
          payment.cashSessionId === sessionId &&
          payment.method === PaymentMethod.CASH,
      )
      .reduce((sum, payment) => sum + payment.amount, 0);
    const expectedBalance = round2(300 + cashSales);
    sessions.push({
      id: sessionId,
      waiterKey,
      openingBalance: 300,
      expectedBalance,
      closingBalance: expectedBalance,
      difference: 0,
      status: CashSessionStatus.CLOSED,
      openedAt: atUtc(now, -day, 11),
      closedAt: atUtc(now, -day, 23),
    });
  }

  const activeOrders = [
    makeOrder(
      ++orderIndex,
      [
        ['classic', 1],
        ['coke', 1],
      ],
      1,
      'waiter-2',
      OrderStatus.PENDING,
      new Date(now.getTime() - 55 * 60 * 1000),
    ),
    makeOrder(
      ++orderIndex,
      [
        ['crispy', 2],
        ['fries', 1],
        ['lemonade', 2],
      ],
      3,
      'waiter-2',
      OrderStatus.IN_PROGRESS,
      new Date(now.getTime() - 35 * 60 * 1000),
    ),
    makeOrder(
      ++orderIndex,
      [
        ['double-smash', 2],
        ['loaded-fries', 1],
        ['sprite', 2],
      ],
      5,
      'waiter-1',
      OrderStatus.READY,
      new Date(now.getTime() - 20 * 60 * 1000),
    ),
  ];
  sessions.push({
    id: demoUuid(9, 9),
    waiterKey: 'waiter-1',
    openingBalance: 300,
    status: CashSessionStatus.OPEN,
    openedAt: new Date(now.getTime() - 3 * 60 * 60 * 1000),
  });
  const orders = [...completedOrders, ...activeOrders];

  const kitchenOrders = orders.map((order, index) => ({
    id: demoUuid(8, index + 1),
    orderId: order.id,
    status:
      order.status === OrderStatus.PENDING
        ? KitchenStatus.PENDING
        : order.status === OrderStatus.IN_PROGRESS
          ? KitchenStatus.IN_PROGRESS
          : KitchenStatus.READY,
    createdAt: order.createdAt,
    updatedAt: order.updatedAt,
  }));

  const consumption: DemoInventoryMovement[] = [];
  let outputIndex = 0;
  for (const order of orders) {
    const byIngredient = new Map<string, number>();
    for (const orderItem of order.items) {
      for (const recipe of recipesByMenu.get(orderItem.menuKey) ?? []) {
        byIngredient.set(
          recipe.inventoryKey,
          (byIngredient.get(recipe.inventoryKey) ?? 0) +
            recipe.quantity * orderItem.quantity,
        );
      }
    }
    for (const [inventoryKey, quantity] of byIngredient) {
      consumption.push({
        id: demoUuid(12, ++outputIndex),
        inventoryKey,
        quantity: round2(quantity),
        unitCost: inventoryCost.get(inventoryKey) ?? 0,
        reason: InventoryOutputReason.CONSUMPTION,
        waiterKey: order.waiterKey,
        note: `${DEMO_MARKER}: consumo por orden ${order.id}`,
        createdAt: order.createdAt,
      });
    }
  }
  const wasteDefinitions: Array<[string, number, number]> = [
    ['potato', 0.8, 3],
    ['lettuce', 0.3, 5],
    ['tomato', 0.25, 6],
    ['bun', 4, 2],
    ['ice-cream', 0.2, 4],
  ];
  const waste: DemoInventoryMovement[] = wasteDefinitions.map(
    ([inventoryKey, quantity, daysAgo]) => ({
      id: demoUuid(12, ++outputIndex),
      inventoryKey,
      quantity,
      unitCost: inventoryCost.get(inventoryKey) ?? 0,
      reason: InventoryOutputReason.WASTE,
      waiterKey: daysAgo % 2 === 0 ? 'waiter-1' : 'waiter-2',
      note: `${DEMO_MARKER}: merma operativa registrada`,
      createdAt: atUtc(now, -daysAgo, 16),
    }),
  );
  const outputs: DemoInventoryMovement[] = [...consumption, ...waste];
  const outputTotals = new Map<string, number>();
  for (const output of outputs) {
    outputTotals.set(
      output.inventoryKey,
      round2((outputTotals.get(output.inventoryKey) ?? 0) + output.quantity),
    );
  }
  const inventory: DemoInventoryItem[] = inventoryBase.map((item) => ({
    id: item.id,
    key: item.key,
    name: item.name,
    description: item.description,
    unit: item.unit,
    unitCost: item.unitCost,
    minStock: item.minStock,
    quantity: item.targetStock,
  }));
  const entries: DemoInventoryMovement[] = inventoryBase.map((item, index) => ({
    id: demoUuid(11, index + 1),
    inventoryKey: item.key,
    quantity: round2(item.targetStock + (outputTotals.get(item.key) ?? 0)),
    unitCost: item.unitCost,
    waiterKey: 'waiter-1',
    note: `${DEMO_MARKER}: inventario inicial`,
    createdAt: atUtc(now, -10, 9),
  }));

  const reservations = [
    {
      tableNumber: 2,
      customerName: 'Mariana López',
      phone: '+59171234501',
      email: 'mariana.demo@example.invalid',
      guests: 2,
      reservationAt: atUtc(now, -4, 20),
      status: ReservationStatus.COMPLETED,
      note: 'Cena de aniversario',
    },
    {
      tableNumber: 7,
      customerName: 'Carlos Aguirre',
      phone: '+59171234502',
      email: 'carlos.demo@example.invalid',
      guests: 6,
      reservationAt: atUtc(now, -2, 19),
      status: ReservationStatus.COMPLETED,
      note: 'Reunión familiar',
    },
    {
      tableNumber: 4,
      customerName: 'Lucía Salazar',
      phone: '+59171234503',
      guests: 3,
      reservationAt: atUtc(now, -1, 21),
      status: ReservationStatus.CANCELLED,
      note: 'Cancelada por el cliente',
    },
    {
      tableNumber: 8,
      customerName: 'Diego Fernández',
      phone: '+59171234504',
      email: 'diego.demo@example.invalid',
      guests: 6,
      reservationAt: atUtc(now, 1, 20),
      status: ReservationStatus.CONFIRMED,
      note: 'Cumpleaños',
    },
    {
      tableNumber: 10,
      customerName: 'Paola Méndez',
      phone: '+59171234505',
      guests: 8,
      reservationAt: atUtc(now, 2, 19),
      status: ReservationStatus.CONFIRMED,
      note: 'Cena de equipo',
    },
    {
      tableNumber: 6,
      customerName: 'Andrés Molina',
      phone: '+59171234506',
      email: 'andres.demo@example.invalid',
      guests: 4,
      reservationAt: atUtc(now, 3, 20),
      status: ReservationStatus.PENDING,
      note: 'Solicita mesa tranquila',
    },
    {
      tableNumber: 11,
      customerName: 'Natalia Suárez',
      phone: '+59171234507',
      guests: 7,
      reservationAt: atUtc(now, 4, 21),
      status: ReservationStatus.CANCELLED,
      note: 'Reserva futura cancelada',
    },
  ].map((reservation, index) => ({
    id: demoUuid(13, index + 1),
    ...reservation,
    createdAt: atUtc(now, -6, 10 + index),
    updatedAt: atUtc(now, -6, 10 + index),
  }));

  return {
    users,
    tables,
    inventory,
    menu,
    recipes,
    orders,
    kitchenOrders,
    sessions,
    payments,
    entries,
    outputs,
    reservations,
  };
}
