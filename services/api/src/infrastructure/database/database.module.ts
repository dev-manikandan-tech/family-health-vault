import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule, TypeOrmModuleOptions } from '@nestjs/typeorm';
import { databaseConfig } from '../config/database.config';
import { UserOrmEntity } from '../orm/entities/user.orm-entity';
import { DeviceSessionOrmEntity } from '../orm/entities/device-session.orm-entity';
import { AuditLogOrmEntity } from '../orm/entities/audit-log.orm-entity';

@Module({
  imports: [
    ConfigModule.forFeature(databaseConfig),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) =>
        configService.get<TypeOrmModuleOptions>(
          'database',
        ) as TypeOrmModuleOptions,
    }),
    TypeOrmModule.forFeature([
      UserOrmEntity,
      DeviceSessionOrmEntity,
      AuditLogOrmEntity,
    ]),
  ],
  exports: [TypeOrmModule],
})
export class DatabaseModule {}
