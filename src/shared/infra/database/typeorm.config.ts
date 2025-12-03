import { TypeOrmModuleOptions } from "@nestjs/typeorm";

const isProd = (process.env.NODE_ENV || '').toLowerCase() === 'production';

export const typeOrmConfig: TypeOrmModuleOptions = {
    type: 'postgres',
    host: process.env.DB_HOST || 'localhost',
    port: Number(process.env.DB_PORT) || 5433,
    username: process.env.DB_USERNAME || 'postgres',
    password: process.env.DB_PASSWORD || 'PGD2025.',
    database: process.env.DB_NAME || 'RestOrderSystem',
    autoLoadEntities: true,
    synchronize: !isProd,
    logging: !isProd,
};