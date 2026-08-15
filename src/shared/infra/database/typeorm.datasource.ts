import 'reflect-metadata';
import * as dotenv from 'dotenv';
import { join } from 'path';
import { DataSource, DataSourceOptions } from 'typeorm';

dotenv.config({ path: '.env', quiet: true });

type DatabaseEnvironment = Partial<
  Record<'NODE_ENV' | 'DB_SSL' | 'DB_SSL_CA', string>
>;

export function getDatabaseSslOptions(
  env: DatabaseEnvironment = process.env,
): false | { rejectUnauthorized: true; ca?: string } {
  const configured = env.DB_SSL?.trim().toLowerCase();
  if (configured && configured !== 'true' && configured !== 'false') {
    throw new Error('DB_SSL debe ser true o false');
  }

  const isProduction = env.NODE_ENV?.toLowerCase() === 'production';
  if (isProduction && configured === 'false') {
    throw new Error('DB_SSL no puede deshabilitarse en producción');
  }

  const enabled = isProduction || configured === 'true';
  if (!enabled) return false;

  const ca = env.DB_SSL_CA?.replace(/\\n/g, '\n').trim();
  return ca ? { rejectUnauthorized: true, ca } : { rejectUnauthorized: true };
}

export const databaseOptions: DataSourceOptions = {
  type: 'postgres',
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT),
  username: process.env.DB_USER,
  password: process.env.DB_PASS,
  database: process.env.DB_NAME,
  ssl: getDatabaseSslOptions(),
  entities: [join(__dirname, '../../../core/entities/*.entity{.ts,.js}')],
  migrations: [join(__dirname, 'migrations/*{.ts,.js}')],
};

export default new DataSource({
  ...databaseOptions,
  synchronize: false,
});
