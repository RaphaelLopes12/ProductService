import { Injectable, Logger, Inject } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';

export const REDIS_CLIENT = Symbol('REDIS_CLIENT');

@Injectable()
export class CacheService {
  private readonly logger = new Logger(CacheService.name);

  constructor(
    @Inject(CACHE_MANAGER) private readonly cacheManager: Cache,
    @Inject(REDIS_CLIENT) private readonly redisClient: any,
  ) {}

  async get<T>(key: string): Promise<T | null> {
    try {
      const value = await this.cacheManager.get<T>(key);
      return value ?? null;
    } catch (error) {
      this.logger.warn(`Cache GET failed for "${key}": ${error.message}`);
      return null;
    }
  }

  async set<T>(key: string, value: T, ttl?: number): Promise<void> {
    try {
      await this.cacheManager.set(key, value, ttl);
    } catch (error) {
      this.logger.warn(`Cache SET failed for "${key}": ${error.message}`);
    }
  }

  async del(key: string): Promise<void> {
    try {
      await this.cacheManager.del(key);
    } catch (error) {
      this.logger.warn(`Cache DEL failed for "${key}": ${error.message}`);
    }
  }

  async invalidateByPrefix(prefix: string): Promise<void> {
    try {
      let cursor = 0;
      do {
        const { cursor: next, keys } = await this.redisClient.scan(cursor, {
          MATCH: `${prefix}*`,
          COUNT: 100,
        });
        if (keys.length) {
          await this.redisClient.del(keys);
        }
        cursor = next;
      } while (cursor !== 0);
    } catch (error) {
      this.logger.warn(
        `Cache INVALIDATE failed for prefix "${prefix}": ${error.message}`,
      );
    }
  }
}
