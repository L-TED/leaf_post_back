import { TypeOrmModuleOptions } from '@nestjs/typeorm';

export const typeormConfig: TypeOrmModuleOptions = {
  type: 'postgres',
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT ?? 5432),
  username: process.env.DB_USERNAME,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_DATABASE,
  ssl:
    String(process.env.DB_SSL ?? '').toLowerCase() === 'true' ||
    process.env.DB_SSL === '1'
      ? {
          rejectUnauthorized:
            String(
              process.env.DB_SSL_REJECT_UNAUTHORIZED ?? 'true',
            ).toLowerCase() === 'true' ||
            process.env.DB_SSL_REJECT_UNAUTHORIZED === '1',
        }
      : undefined,
  autoLoadEntities: true,
  synchronize: false,
};
