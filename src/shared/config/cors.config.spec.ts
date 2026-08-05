import { getCorsOrigins } from './cors.config';

describe('getCorsOrigins', () => {
  it('uses the local frontend by default', () => {
    expect(getCorsOrigins('')).toEqual(['http://localhost:4200']);
  });

  it('normalizes and deduplicates configured origins', () => {
    expect(
      getCorsOrigins(
        'https://app.restaurant.test, https://admin.restaurant.test,https://app.restaurant.test',
      ),
    ).toEqual(['https://app.restaurant.test', 'https://admin.restaurant.test']);
  });
});
