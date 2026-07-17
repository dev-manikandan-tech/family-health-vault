import { AsyncLocalStorage } from 'async_hooks';
import { Injectable } from '@nestjs/common';
import { DataSource, EntityManager, QueryRunner } from 'typeorm';

export interface RlsContext {
  userId?: string;
  familyIds?: string[];
  queryRunner?: QueryRunner;
}

@Injectable()
export class RlsContextService {
  private readonly asyncLocalStorage = new AsyncLocalStorage<RlsContext>();

  constructor(private readonly dataSource: DataSource) {}

  getManager(): EntityManager {
    const store = this.asyncLocalStorage.getStore();
    return store?.queryRunner?.manager ?? this.dataSource.manager;
  }

  getCurrentUserId(): string | undefined {
    return this.asyncLocalStorage.getStore()?.userId;
  }

  getCurrentFamilyIds(): string[] | undefined {
    return this.asyncLocalStorage.getStore()?.familyIds;
  }

  async run<T>(
    userId: string | undefined,
    familyIds: string[] | undefined,
    callback: () => Promise<T>,
  ): Promise<T> {
    if (this.dataSource.options.type !== 'postgres') {
      return callback();
    }

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      if (userId) {
        await this.setVariable(queryRunner, 'app.current_user_id', userId);
      }
      if (familyIds) {
        const formatted = `{${familyIds.map((id) => this.escapeIdentifier(id)).join(',')}}`;
        await this.setVariable(
          queryRunner,
          'app.current_family_ids',
          formatted,
        );
      }

      const result = await this.asyncLocalStorage.run(
        { userId, familyIds, queryRunner },
        callback,
      );

      await queryRunner.commitTransaction();
      return result;
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  private async setVariable(
    queryRunner: QueryRunner,
    name: string,
    value: string,
  ): Promise<void> {
    await queryRunner.query(
      `SET LOCAL ${name} = '${this.escapeLiteral(value)}'`,
    );
  }

  private escapeLiteral(value: string): string {
    return value.replace(/\\/g, '\\\\').replace(/'/g, "''");
  }

  private escapeIdentifier(value: string): string {
    return value.replace(/[{}'"\\]/g, '');
  }
}
