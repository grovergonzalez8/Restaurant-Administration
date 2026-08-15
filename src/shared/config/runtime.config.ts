type RuntimeEnvironment = Partial<
  Record<'NODE_ENV' | 'SWAGGER_ENABLED', string>
>;

export function isSwaggerEnabled(
  env: RuntimeEnvironment = process.env,
): boolean {
  const configured = env.SWAGGER_ENABLED?.trim().toLowerCase();
  if (configured && configured !== 'true' && configured !== 'false') {
    throw new Error('SWAGGER_ENABLED debe ser true o false');
  }
  return configured
    ? configured === 'true'
    : env.NODE_ENV?.toLowerCase() !== 'production';
}
