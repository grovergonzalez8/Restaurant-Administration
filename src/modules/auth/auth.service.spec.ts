import { UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Repository } from 'typeorm';
import { UserEntity } from 'src/core/entities/user.entity';
import { comparePassword } from 'src/shared/utils/hash.util';
import { AuthService } from './auth.service';

jest.mock('src/shared/utils/hash.util', () => ({
  comparePassword: jest.fn(),
}));

describe('AuthService', () => {
  const users = { findOne: jest.fn() };
  const jwt = { sign: jest.fn() };
  const service = new AuthService(
    users as unknown as Repository<UserEntity>,
    jwt as unknown as JwtService,
  );
  const compare = comparePassword as jest.MockedFunction<
    typeof comparePassword
  >;

  beforeEach(() => jest.clearAllMocks());

  it('issues a token containing the current user role', async () => {
    const user = {
      id: 'user-1',
      email: 'waiter@restaurant.test',
      passwordHash: 'hash',
      isActive: true,
      sessionVersion: 3,
      role: { name: 'waiter' },
    };
    users.findOne.mockResolvedValue(user);
    compare.mockResolvedValue(true);
    jwt.sign.mockReturnValue('token');

    const result = await service.login({
      email: user.email,
      password: 'Waiter123*',
    });

    expect(jwt.sign).toHaveBeenCalledWith({
      sub: user.id,
      email: user.email,
      role: 'waiter',
      sessionVersion: 3,
    });
    expect(result.access_token).toBe('token');
  });

  it('rejects invalid credentials', async () => {
    users.findOne.mockResolvedValue(null);

    await expect(
      service.login({ email: 'missing@restaurant.test', password: 'wrong' }),
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('rejects credentials for inactive staff', async () => {
    users.findOne.mockResolvedValue({
      id: 'user-1',
      passwordHash: 'hash',
      isActive: false,
      role: { name: 'waiter' },
    });

    await expect(
      service.login({
        email: 'waiter@restaurant.test',
        password: 'Waiter123*',
      }),
    ).rejects.toBeInstanceOf(UnauthorizedException);
    expect(compare).not.toHaveBeenCalled();
  });

  it('only resolves active users for authenticated requests', async () => {
    users.findOne.mockResolvedValue(null);

    await service.findById('user-1', 3);

    expect(users.findOne).toHaveBeenCalledWith({
      where: { id: 'user-1', isActive: true },
      relations: ['role'],
      select: [
        'id',
        'name',
        'email',
        'phone',
        'isActive',
        'sessionVersion',
        'createdAt',
        'updatedAt',
      ],
    });
  });

  it('rejects a token issued before the latest password change', async () => {
    users.findOne.mockResolvedValue({
      id: 'user-1',
      isActive: true,
      sessionVersion: 4,
    });

    await expect(service.findById('user-1', 3)).resolves.toBeNull();
  });
});
