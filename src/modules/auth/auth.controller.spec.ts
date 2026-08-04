import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';

describe('AuthController', () => {
  const auth = { login: jest.fn() };
  const controller = new AuthController(auth as unknown as AuthService);

  beforeEach(() => jest.clearAllMocks());

  it('never exposes internal authentication data on login', async () => {
    auth.login.mockResolvedValue({
      access_token: 'token',
      user: {
        id: 'user-1',
        email: 'waiter@restaurant.test',
        passwordHash: 'secret-hash',
        sessionVersion: 3,
      },
    });

    const result = await controller.login({
      email: 'waiter@restaurant.test',
      password: 'Waiter123*',
    });

    expect(result).toEqual({
      access_token: 'token',
      user: { id: 'user-1', email: 'waiter@restaurant.test' },
    });
  });
});
