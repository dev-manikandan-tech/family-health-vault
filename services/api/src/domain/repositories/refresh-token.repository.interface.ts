import { RefreshToken } from '../entities/refresh-token.entity';

export interface IRefreshTokenRepository {
  findByTokenHash(tokenHash: string): Promise<RefreshToken | null>;
  save(token: RefreshToken): Promise<RefreshToken>;
  revoke(id: string): Promise<void>;
}
