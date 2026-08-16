type DemoSeedEnvironment = Partial<
  Record<'NODE_ENV' | 'ALLOW_DEMO_SEED' | 'DEMO_USER_PASSWORD', string>
>;

export function getDemoSeedConfig(env: DemoSeedEnvironment = process.env): {
  password: string;
  production: boolean;
} {
  const production = env.NODE_ENV?.trim().toLowerCase() === 'production';
  if (production && env.ALLOW_DEMO_SEED?.trim().toLowerCase() !== 'true') {
    throw new Error(
      'Demo seed bloqueado en producción: configura ALLOW_DEMO_SEED=true sólo durante la ejecución explícita',
    );
  }
  const password = env.DEMO_USER_PASSWORD;
  if (!password || password.length < 12) {
    throw new Error('DEMO_USER_PASSWORD debe tener al menos 12 caracteres');
  }
  return { password, production };
}

export function classifyDemoDataset(
  counts: number[],
  expectedCounts: number[],
): 'empty' | 'complete' {
  if (
    counts.length !== expectedCounts.length ||
    counts.some((count, index) => count < 0 || count > expectedCounts[index])
  ) {
    throw new Error('Conteos del dataset demo no válidos');
  }
  if (counts.every((count, index) => count === expectedCounts[index])) {
    return 'complete';
  }
  if (counts.every((count) => count === 0)) return 'empty';
  throw new Error(
    'Seed demo cancelado: se detectó un dataset demo parcial; no se modificarán ni completarán datos ambiguos',
  );
}
