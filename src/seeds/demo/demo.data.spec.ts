import { CashSessionStatus } from '../../core/enums/cash-session-status.enum';
import { InventoryOutputReason } from '../../core/enums/inventory-output-reason.enum';
import { OrderStatus } from '../../core/enums/order-status.enum';
import { PaymentMethod } from '../../core/enums/payment-method.enum';
import { classifyDemoDataset, getDemoSeedConfig } from './demo.config';
import { buildDemoScenario } from './demo.data';

describe('Urban Burger & Grill demo dataset', () => {
  const now = new Date('2026-08-16T18:00:00.000Z');
  const scenario = buildDemoScenario(now);

  it('contains the expected modules without an admin user', () => {
    expect(scenario.users).toHaveLength(4);
    expect(scenario.users.map((user) => user.role).sort()).toEqual([
      'host',
      'kitchen',
      'waiter',
      'waiter',
    ]);
    expect(
      scenario.users.some((user) => user.role === ('admin' as never)),
    ).toBe(false);
    expect(scenario.tables).toHaveLength(12);
    expect(scenario.inventory).toHaveLength(31);
    expect(scenario.menu).toHaveLength(15);
    expect(scenario.recipes).toHaveLength(69);
    expect(scenario.orders).toHaveLength(43);
    expect(
      scenario.orders.filter((order) => order.status === OrderStatus.COMPLETED),
    ).toHaveLength(40);
    expect(scenario.payments).toHaveLength(40);
    expect(scenario.sessions).toHaveLength(9);
    expect(scenario.reservations).toHaveLength(7);
  });

  it('keeps every foreign-key reference inside the demo scenario', () => {
    const tableNumbers = new Set(scenario.tables.map((table) => table.number));
    const userKeys = new Set(scenario.users.map((user) => user.key));
    const menuKeys = new Set(scenario.menu.map((item) => item.key));
    const inventoryKeys = new Set(scenario.inventory.map((item) => item.key));
    const orderIds = new Set(scenario.orders.map((order) => order.id));
    const sessionIds = new Set(scenario.sessions.map((session) => session.id));
    for (const recipe of scenario.recipes) {
      expect(menuKeys.has(recipe.menuKey)).toBe(true);
      expect(inventoryKeys.has(recipe.inventoryKey)).toBe(true);
    }
    for (const order of scenario.orders) {
      expect(tableNumbers.has(order.tableNumber)).toBe(true);
      expect(userKeys.has(order.waiterKey)).toBe(true);
      expect(order.items.every((item) => menuKeys.has(item.menuKey))).toBe(
        true,
      );
    }
    for (const payment of scenario.payments) {
      expect(orderIds.has(payment.orderId)).toBe(true);
      expect(sessionIds.has(payment.cashSessionId)).toBe(true);
    }
    for (const reservation of scenario.reservations) {
      const table = scenario.tables.find(
        (candidate) => candidate.number === reservation.tableNumber,
      );
      expect(table).toBeDefined();
      expect(reservation.guests).toBeLessThanOrEqual(table!.capacity);
    }
  });

  it('balances order totals, payments and cash sessions', () => {
    const orders = new Map(scenario.orders.map((order) => [order.id, order]));
    for (const order of scenario.orders) {
      expect(order.total).toBe(
        order.items.reduce((sum, item) => sum + item.subtotal, 0),
      );
      expect(order.items.every((item) => item.unitPrice > item.unitCost)).toBe(
        true,
      );
    }
    for (const payment of scenario.payments) {
      expect(payment.amount).toBe(orders.get(payment.orderId)?.total);
      if (payment.method === PaymentMethod.CASH) {
        expect(payment.receivedAmount).not.toBeNull();
        expect(payment.changeAmount).toBe(
          Number(payment.receivedAmount) - payment.amount,
        );
      } else {
        expect(payment.receivedAmount).toBeNull();
        expect(payment.changeAmount).toBeNull();
      }
    }
    for (const session of scenario.sessions) {
      if (session.status !== CashSessionStatus.CLOSED) continue;
      const cashSales = scenario.payments
        .filter(
          (payment) =>
            payment.cashSessionId === session.id &&
            payment.method === PaymentMethod.CASH,
        )
        .reduce((sum, payment) => sum + payment.amount, 0);
      expect(session.expectedBalance).toBe(session.openingBalance + cashSales);
      expect(session.closingBalance).toBe(session.expectedBalance);
      expect(session.difference).toBe(0);
    }
  });

  it('balances inventory entries, outputs and current stock', () => {
    for (const item of scenario.inventory) {
      const entries = scenario.entries
        .filter((entry) => entry.inventoryKey === item.key)
        .reduce((sum, entry) => sum + entry.quantity, 0);
      const outputs = scenario.outputs
        .filter((output) => output.inventoryKey === item.key)
        .reduce((sum, output) => sum + output.quantity, 0);
      expect(Math.round((entries - outputs) * 100) / 100).toBe(item.quantity);
      expect(item.quantity).toBeGreaterThanOrEqual(0);
    }
    expect(
      scenario.outputs.filter(
        (output) => output.reason === InventoryOutputReason.WASTE,
      ),
    ).toHaveLength(5);
  });

  it('uses deterministic IDs and treats complete reruns as no-ops', () => {
    const rebuilt = buildDemoScenario(now);
    expect(rebuilt.users.map((item) => item.id)).toEqual(
      scenario.users.map((item) => item.id),
    );
    expect(rebuilt.orders.map((item) => item.id)).toEqual(
      scenario.orders.map((item) => item.id),
    );
    expect(classifyDemoDataset([0, 0, 0], [4, 12, 43])).toBe('empty');
    expect(classifyDemoDataset([4, 12, 43], [4, 12, 43])).toBe('complete');
    expect(() => classifyDemoDataset([4, 0, 43], [4, 12, 43])).toThrow(
      'dataset demo parcial',
    );
  });

  it('requires an explicit production opt-in and a runtime password', () => {
    expect(() =>
      getDemoSeedConfig({
        NODE_ENV: 'production',
        DEMO_USER_PASSWORD: 'x'.repeat(12),
      }),
    ).toThrow('ALLOW_DEMO_SEED=true');
    expect(() =>
      getDemoSeedConfig({
        NODE_ENV: 'development',
        DEMO_USER_PASSWORD: 'short',
      }),
    ).toThrow('al menos 12 caracteres');
    expect(
      getDemoSeedConfig({
        NODE_ENV: 'production',
        ALLOW_DEMO_SEED: 'true',
        DEMO_USER_PASSWORD: 'x'.repeat(12),
      }),
    ).toEqual({ password: 'x'.repeat(12), production: true });
  });
});
