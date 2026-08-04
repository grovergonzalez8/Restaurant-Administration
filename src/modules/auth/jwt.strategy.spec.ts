import { ConfigService } from '@nestjs/config';
import { AuthService } from './auth.service';
import { JwtStrategy } from './jwt.strategy';

describe('JwtStrategy', () => {
  it('validates both the user and token session version', async () => {
    const auth = { findById: jest.fn().mockResolvedValue({ id: 'user-1' }) };
    const config = {
      get: jest.fn((key: string, fallback?: string) =>
        key === 'JWT_SECRET' ? 'test-secret-with-enough-length' : fallback,
      ),
    };
    const strategy = new JwtStrategy(
      auth as unknown as AuthService,
      config as unknown as ConfigService,
    );

    await strategy.validate({ sub: 'user-1', sessionVersion: 5 });

    expect(auth.findById).toHaveBeenCalledWith('user-1', 5);
  });
});
