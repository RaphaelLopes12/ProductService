import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { CacheModule, CACHE_MANAGER } from '@nestjs/cache-manager';
import { redisStore } from 'cache-manager-redis-yet';
import { CacheService, REDIS_CLIENT } from './cache.service';

@Module({
  imports: [
    CacheModule.registerAsync({
      inject: [ConfigService],
      useFactory: async (config: ConfigService) => ({
        store: await redisStore({
          socket: {
            host: config.get<string>('REDIS_HOST'),
            port: config.get<number>('REDIS_PORT'),
            tls: config.get<boolean>('REDIS_TLS'),
          },
          password: config.get<string>('REDIS_PASSWORD') || undefined,
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
