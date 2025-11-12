import { TypeOrmModuleOptions } from "@nestjs/typeorm";

export const typeOrmConfig: TypeOrmModuleOptions = {
    type: 'postgres',
    host: 'localhost',
    port: 5433,
    username: 'postgres',
    password: 'PGD2025.',
    database: 'RestOrderSystem',
    autoLoadEntities: true,
    synchronize: true,
};