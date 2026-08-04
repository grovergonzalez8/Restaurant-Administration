import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import { databaseOptions } from './typeorm.datasource';

const isProd = (process.env.NODE_ENV || '').toLowerCase() === 'production';

export const typeOrmConfig: TypeOrmModuleOptions = {
  ...databaseOptions,
  autoLoadEntities: true,
  synchronize: !isProd,
  migrationsRun: isProd,
  logging: !isProd,
};
