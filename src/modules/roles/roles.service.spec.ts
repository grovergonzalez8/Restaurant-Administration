import { Repository } from 'typeorm';
import { RoleEntity } from 'src/core/entities/role.entity';
import { RolesService } from './roles.service';

describe('RolesService', () => {
  const repository = { find: jest.fn() };
  const service = new RolesService(
    repository as unknown as Repository<RoleEntity>,
  );

  beforeEach(() => jest.clearAllMocks());

  it('loads every configured role', async () => {
    const roles = [{ id: 1, name: 'admin' }] as RoleEntity[];
    repository.find.mockResolvedValue(roles);

    await expect(service.findAll()).resolves.toBe(roles);
    expect(repository.find).toHaveBeenCalledTimes(1);
  });
});
