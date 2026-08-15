import { INestApplicationContext, NotFoundException } from '@nestjs/common';
import { RolesService } from 'src/modules/roles/roles.service';
import { UsersService } from 'src/modules/users/users.service';
import { getBootstrapAdmin, seedUsers } from './users.seed';

describe('seedUsers', () => {
  const roles = { findByName: jest.fn() };
  const users = { findByEmail: jest.fn(), create: jest.fn() };
  const app = {
    get: jest.fn((token: unknown) => {
      if (token === RolesService) return roles;
      if (token === UsersService) return users;
      throw new Error('Unexpected provider');
    }),
  } as unknown as INestApplicationContext;
  const environment = {
    BOOTSTRAP_ADMIN_NAME: 'Initial Admin',
    BOOTSTRAP_ADMIN_EMAIL: 'initial-admin@example.invalid',
    BOOTSTRAP_ADMIN_PASSWORD: 'test-only-password-123',
  };

  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(console, 'log').mockImplementation(() => undefined);
    roles.findByName.mockResolvedValue({ id: 1, name: 'admin' });
  });

  afterEach(() => jest.restoreAllMocks());

  it('does nothing when bootstrap variables are absent', async () => {
    await seedUsers(app, {});

    expect(users.create).not.toHaveBeenCalled();
  });

  it('requires a complete and strong bootstrap configuration', () => {
    expect(() =>
      getBootstrapAdmin({ BOOTSTRAP_ADMIN_EMAIL: 'admin@example.invalid' }),
    ).toThrow('son obligatorios');
    expect(() =>
      getBootstrapAdmin({
        ...environment,
        BOOTSTRAP_ADMIN_PASSWORD: 'short',
      }),
    ).toThrow('al menos 12 caracteres');
  });

  it('creates only the configured initial administrator', async () => {
    users.findByEmail.mockRejectedValue(
      new NotFoundException('Usuario no encontrado'),
    );
    users.create.mockResolvedValue({});

    await seedUsers(app, environment);

    expect(users.create).toHaveBeenCalledTimes(1);
    expect(users.create).toHaveBeenCalledWith({
      name: environment.BOOTSTRAP_ADMIN_NAME,
      email: environment.BOOTSTRAP_ADMIN_EMAIL,
      password: environment.BOOTSTRAP_ADMIN_PASSWORD,
      phone: undefined,
      roleId: 1,
    });
  });

  it('does not modify an existing administrator', async () => {
    users.findByEmail.mockResolvedValue({ role: { id: 1 } });

    await seedUsers(app, environment);

    expect(users.create).not.toHaveBeenCalled();
  });
});
