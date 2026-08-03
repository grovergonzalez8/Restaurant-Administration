import { INestApplicationContext, NotFoundException } from '@nestjs/common';
import { RolesService } from 'src/modules/roles/roles.service';
import { UsersService } from 'src/modules/users/users.service';
import { seedUsers } from './users.seed';

describe('seedUsers', () => {
  const roles = { findByName: jest.fn(), create: jest.fn() };
  const users = {
    findByEmail: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
  };
  const app = {
    get: jest.fn((token: unknown) => {
      if (token === RolesService) return roles;
      if (token === UsersService) return users;
      throw new Error('Unexpected provider');
    }),
  } as unknown as INestApplicationContext;

  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(console, 'log').mockImplementation(() => undefined);
    roles.findByName.mockImplementation((name: string) =>
      Promise.resolve({
        id: name === 'admin' ? 1 : name === 'kitchen' ? 2 : 3,
      }),
    );
  });

  afterEach(() => jest.restoreAllMocks());

  it('creates demo users when their email does not exist', async () => {
    users.findByEmail.mockRejectedValue(
      new NotFoundException('Usuario no encontrado'),
    );
    users.create.mockResolvedValue({});

    await seedUsers(app);

    expect(users.create).toHaveBeenCalledTimes(3);
    expect(users.create).toHaveBeenCalledWith(
      expect.objectContaining({
        email: 'waiter@restaurant.test',
        roleId: 3,
      }),
    );
  });

  it('corrects the role of an existing seeded user', async () => {
    users.findByEmail.mockImplementation((email: string) =>
      Promise.resolve({ id: email, email, role: { id: 99 } }),
    );
    users.update.mockResolvedValue({});

    await seedUsers(app);

    expect(users.update).toHaveBeenCalledWith('waiter@restaurant.test', {
      roleId: 3,
    });
  });
});
