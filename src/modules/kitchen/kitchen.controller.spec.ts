import { KitchenController } from './kitchen.controller';
import { KitchenService } from './kitchen.service';

describe('KitchenController', () => {
  const kitchenService = { findActive: jest.fn() };
  const controller = new KitchenController(
    kitchenService as unknown as KitchenService,
  );

  beforeEach(() => jest.clearAllMocks());

  it('returns the active kitchen queue', async () => {
    const tickets = [{ id: 'ticket-1', status: 'pending' }];
    kitchenService.findActive.mockResolvedValue(tickets);

    await expect(controller.findActive()).resolves.toBe(tickets);
    expect(kitchenService.findActive).toHaveBeenCalledTimes(1);
  });
});
