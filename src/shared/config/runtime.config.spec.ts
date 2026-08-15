import { isSwaggerEnabled } from './runtime.config';

describe('isSwaggerEnabled', () => {
  it('is enabled by default for development', () => {
    expect(isSwaggerEnabled({ NODE_ENV: 'development' })).toBe(true);
  });

  it('is disabled by default for production', () => {
    expect(isSwaggerEnabled({ NODE_ENV: 'production' })).toBe(false);
  });

  it('supports an explicit valid override', () => {
    expect(
      isSwaggerEnabled({
        NODE_ENV: 'production',
        SWAGGER_ENABLED: 'true',
      }),
    ).toBe(true);
  });

  it('rejects invalid values', () => {
    expect(() => isSwaggerEnabled({ SWAGGER_ENABLED: 'yes' })).toThrow(
      'SWAGGER_ENABLED debe ser true o false',
    );
  });
});
