import { Module } from '@nestjs/common';
import { CacheModule, CACHE_MANAGER } from '@nestjs/cache-manager';
import { redisStore } from 'cache-manager-redis-yet';
import { CacheService, REDIS_CLIENT } from './cache.service';

@Module({
  imports: [
    CacheModule.registerAsync({
      useFactory: async () => ({
        store: await redisStore({
          socket: {
            host: process.env.REDIS_HOST ?? 'localhost',
            port: Number(process.env.REDIS_PORT ?? 6379),
            tls: process.env.REDIS_TLS === 'true',
          },
          password: process.env.REDIS_PASSWORD || undefined,
        }),
      }),
    }),
  ],
  providers: [
    {
      provide: REDIS_CLIENT,
      inject: [CACHE_MANAGER],
      useFactory: (cacheManager: any) =>
        cacheManager.stores[0].store._cache.client,
    },
    CacheService,
  ],
  exports: [CacheService],
})
export class AppCacheModule {}
