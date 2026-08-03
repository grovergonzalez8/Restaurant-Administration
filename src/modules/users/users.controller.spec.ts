import { UserEntity } from 'src/core/entities/user.entity';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';

describe('UsersController', () => {
  const user = {
    id: 'user-1',
    name: 'Ana',
    passwordHash: 'hash',
  } as UserEntity;
  const users = {
    update: jest.fn(),
    remove: jest.fn(),
  };
  const controller = new UsersController(users as unknown as UsersService);

  beforeEach(() => jest.clearAllMocks());

  it('passes the administrator identity when updating staff', async () => {
    users.update.mockResolvedValue(user);

    const result = await controller.update(
      user.id,
      { isActive: false },
      { user: { id: 'admin-1' } as UserEntity },
    );

    expect(users.update).toHaveBeenCalledWith(
      user.id,
      { isActive: false },
      'admin-1',
    );
    expect(result).not.toHaveProperty('passwordHash');
  });

  it('passes the administrator identity when deleting staff', async () => {
    users.remove.mockResolvedValue(undefined);

    await controller.remove(user.id, {
      user: { id: 'admin-1' } as UserEntity,
    });

    expect(users.remove).toHaveBeenCalledWith(user.id, 'admin-1');
  });
});
