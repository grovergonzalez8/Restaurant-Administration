const DEFAULT_ORIGIN = 'http://localhost:4200';

export const getCorsOrigins = (value = process.env.CORS_ORIGIN): string[] => {
  const origins = value
    ?.split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);

  return origins?.length ? [...new Set(origins)] : [DEFAULT_ORIGIN];
};
