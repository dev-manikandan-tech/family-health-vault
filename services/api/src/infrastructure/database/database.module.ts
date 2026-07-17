import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule, TypeOrmModuleOptions } from '@nestjs/typeorm';
import { databaseConfig } from '../config/database.config';
import { UserOrmEntity } from '../orm/entities/user.orm-entity';
import { RefreshTokenOrmEntity } from '../orm/entities/refresh-token.orm-entity';
import { DeviceSessionOrmEntity } from '../orm/entities/device-session.orm-entity';

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
      RefreshTokenOrmEntity,
      DeviceSessionOrmEntity,
    ]),
  ],
  exports: [TypeOrmModule],
})
export class DatabaseModule {}
