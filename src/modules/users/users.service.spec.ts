import { ConflictException } from '@nestjs/common';
import { Repository } from 'typeorm';
import { RoleEntity } from 'src/core/entities/role.entity';
import { UserEntity } from 'src/core/entities/user.entity';
import { hashPassword } from 'src/shared/utils/hash.util';
import { UsersService } from './users.service';

jest.mock('src/shared/utils/hash.util', () => ({
  hashPassword: jest.fn(),
}));

describe('UsersService staff lifecycle', () => {
  const users = {
    findOne: jest.fn(),
    save: jest.fn(),
    delete: jest.fn(),
  };
  const roles = { findOne: jest.fn() };
  const service = new UsersService(
    users as unknown as Repository<UserEntity>,
    roles as unknown as Repository<RoleEntity>,
  );
  const passwordHash = hashPassword as jest.MockedFunction<typeof hashPassword>;
  const adminRole = { id: 1, name: 'admin' } as RoleEntity;
  const waiterRole = { id: 2, name: 'waiter' } as RoleEntity;

  beforeEach(() => jest.clearAllMocks());

  it('creates active staff with normalized identity data', async () => {
    users.findOne.mockResolvedValue(null);
    roles.findOne.mockResolvedValue(waiterRole);
    passwordHash.mockResolvedValue('hash');
    users.save.mockImplementation((user: UserEntity) => Promise.resolve(user));

    const user = await service.create({
      name: ' Ana Pérez ',
      email: ' ANA@EXAMPLE.COM ',
      password: 'secret1',
      roleId: waiterRole.id,
    });

    expect(user).toEqual(
      expect.objectContaining({
        name: 'Ana Pérez',
        email: 'ana@example.com',
        isActive: true,
      }),
    );
  });

  it('deactivates another staff account', async () => {
    const user = {
      id: 'waiter-1',
      email: 'waiter@restaurant.test',
      role: waiterRole,
      isActive: true,
    } as UserEntity;
    users.findOne.mockResolvedValue(user);
    users.save.mockImplementation((value: UserEntity) =>
      Promise.resolve(value),
    );

    const updated = await service.update(
      user.id,
      { isActive: false },
      'admin-1',
    );

    expect(updated.isActive).toBe(false);
  });

  it('rejects self-deactivation and self role downgrade', async () => {
    const user = {
      id: 'admin-1',
      role: adminRole,
      isActive: true,
    } as UserEntity;
    users.findOne.mockResolvedValue(user);

    await expect(
      service.update(user.id, { isActive: false }, user.id),
    ).rejects.toBeInstanceOf(ConflictException);

    roles.findOne.mockResolvedValue(waiterRole);
    await expect(
      service.update(user.id, { roleId: waiterRole.id }, user.id),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it('rejects an email already assigned to another account', async () => {
    const user = {
      id: 'waiter-1',
      email: 'old@restaurant.test',
      role: waiterRole,
    } as UserEntity;
    users.findOne
      .mockResolvedValueOnce(user)
      .mockResolvedValueOnce({ id: 'waiter-2' });

    await expect(
      service.update(user.id, { email: 'USED@RESTAURANT.TEST' }, 'admin-1'),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it('prevents deleting the current administrator account', async () => {
    await expect(service.remove('admin-1', 'admin-1')).rejects.toBeInstanceOf(
      ConflictException,
    );
    expect(users.delete).not.toHaveBeenCalled();
  });
});
