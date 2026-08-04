import { RolesController } from './roles.controller';
import { RolesService } from './roles.service';

describe('RolesController', () => {
  const rolesService = { findAll: jest.fn() };
  const controller = new RolesController(
    rolesService as unknown as RolesService,
  );

  beforeEach(() => jest.clearAllMocks());

  it('returns the configured roles', async () => {
    const roles = [{ id: 1, name: 'admin' }];
    rolesService.findAll.mockResolvedValue(roles);

    await expect(controller.findAll()).resolves.toBe(roles);
    expect(rolesService.findAll).toHaveBeenCalledTimes(1);
  });
});
