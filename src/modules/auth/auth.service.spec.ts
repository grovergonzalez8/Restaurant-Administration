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
    });
    expect(result.access_token).toBe('token');
  });

  it('rejects invalid credentials', async () => {
    users.findOne.mockResolvedValue(null);

    await expect(
      service.login({ email: 'missing@restaurant.test', password: 'wrong' }),
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });
});
