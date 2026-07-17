import { registerAs } from '@nestjs/config';
import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import { UserOrmEntity } from '../orm/entities/user.orm-entity';
import { DeviceSessionOrmEntity } from '../orm/entities/device-session.orm-entity';
import { AuditLogOrmEntity } from '../orm/entities/audit-log.orm-entity';

export const databaseConfig = registerAs(
  'database',
  (): TypeOrmModuleOptions => {
    const dbType = process.env.DB_TYPE || 'postgres';
    const base: TypeOrmModuleOptions = {
      type: dbType as any,
      entities: [UserOrmEntity, DeviceSessionOrmEntity, AuditLogOrmEntity],
      synchronize: process.env.NODE_ENV !== 'production',
      dropSchema: process.env.NODE_ENV === 'test',
      logging: process.env.DB_LOGGING === 'true',
    };

    if (dbType === 'postgres') {
      return {
        ...base,
        url: process.env.DATABASE_URL,
        host: process.env.DB_HOST || 'localhost',
        port: parseInt(process.env.DB_PORT || '5432', 10),
        username: process.env.DB_USERNAME || 'postgres',
        password: process.env.DB_PASSWORD || 'postgres',
        database: process.env.DB_NAME || 'family_health_vault',
      } as TypeOrmModuleOptions;
    }

    if (dbType === 'better-sqlite3') {
      return {
        ...base,
        database: process.env.DB_DATABASE || ':memory:',
      } as TypeOrmModuleOptions;
    }

    throw new Error(`Unsupported DB_TYPE: ${dbType}`);
  },
);
