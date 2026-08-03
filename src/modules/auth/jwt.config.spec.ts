import { ConfigService } from '@nestjs/config';
import { getJwtSecret } from './jwt.config';

describe('getJwtSecret', () => {
  it('uses the configured secret consistently', () => {
    const config = {
      get: jest.fn((key: string, fallback?: string) =>
        key === 'JWT_SECRET' ? 'secure-secret' : fallback,
      ),
    } as unknown as ConfigService;

    expect(getJwtSecret(config)).toBe('secure-secret');
  });

  it('requires an explicit secret in production', () => {
    const config = {
      get: jest.fn((key: string, fallback?: string) =>
        key === 'NODE_ENV' ? 'production' : fallback,
      ),
    } as unknown as ConfigService;

    expect(() => getJwtSecret(config)).toThrow(
      'JWT_SECRET es obligatorio en producción',
    );
  });
});
