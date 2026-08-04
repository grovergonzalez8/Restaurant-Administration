import { TablesController } from './tables.controller';
import { TablesService } from './tables.service';

describe('TablesController', () => {
  const tablesService = { findOverview: jest.fn() };
  const controller = new TablesController(
    tablesService as unknown as TablesService,
  );

  beforeEach(() => jest.clearAllMocks());

  it('returns the operational dining-room overview', async () => {
    const overview = [{ id: 'table-1', activeOrder: null }];
    tablesService.findOverview.mockResolvedValue(overview);

    await expect(controller.findOverview()).resolves.toBe(overview);
    expect(tablesService.findOverview).toHaveBeenCalledTimes(1);
  });
});
