import { getDatabaseSslOptions } from './typeorm.datasource';

describe('getDatabaseSslOptions', () => {
  it('keeps local development connections without TLS by default', () => {
    expect(getDatabaseSslOptions({ NODE_ENV: 'development' })).toBe(false);
  });

  it('requires certificate validation in production by default', () => {
    expect(getDatabaseSslOptions({ NODE_ENV: 'production' })).toEqual({
      rejectUnauthorized: true,
    });
  });

  it('accepts an optional PEM certificate without disabling validation', () => {
    expect(
      getDatabaseSslOptions({
        NODE_ENV: 'production',
        DB_SSL: 'true',
        DB_SSL_CA: 'line-1\\nline-2',
      }),
    ).toEqual({
      rejectUnauthorized: true,
      ca: 'line-1\nline-2',
    });
  });

  it('rejects invalid TLS configuration', () => {
    expect(() =>
      getDatabaseSslOptions({ NODE_ENV: 'production', DB_SSL: 'invalid' }),
    ).toThrow('DB_SSL debe ser true o false');
  });

  it('does not allow TLS to be disabled in production', () => {
    expect(() =>
      getDatabaseSslOptions({ NODE_ENV: 'production', DB_SSL: 'false' }),
    ).toThrow('DB_SSL no puede deshabilitarse en producción');
  });
});
