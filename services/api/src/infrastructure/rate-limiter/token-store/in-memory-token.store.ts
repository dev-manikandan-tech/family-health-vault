import { Injectable } from '@nestjs/common';
import { ITokenStore } from '../../../domain/services/token-store.interface';

@Injectable()
export class InMemoryTokenStore implements ITokenStore {
  private readonly store = new Map<
    string,
    { value: string; expiresAt: number }
  >();

  async set(key: string, value: string, ttlSeconds: number): Promise<void> {
    this.store.set(key, { value, expiresAt: Date.now() + ttlSeconds * 1000 });
  }

  async get(key: string): Promise<string | null> {
    const entry = this.store.get(key);
    if (!entry) return null;
    if (Date.now() > entry.expiresAt) {
      this.store.delete(key);
      return null;
    }
    return entry.value;
  }

  async delete(key: string): Promise<void> {
    this.store.delete(key);
  }
}
