import { Test, TestingModule } from '@nestjs/testing';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { CacheService, REDIS_CLIENT } from './cache.service';

const mockRedisClient = {
  scan: jest.fn(),
  del: jest.fn(),
};

const mockCacheManager = {
  get: jest.fn(),
  set: jest.fn(),
  del: jest.fn(),
};

describe('CacheService', () => {
  let service: CacheService;

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CacheService,
        { provide: CACHE_MANAGER, useValue: mockCacheManager },
        { provide: REDIS_CLIENT, useValue: mockRedisClient },
      ],
    }).compile();
    service = module.get<CacheService>(CacheService);
  });

  describe('get()', () => {
    it('returns cached value when key exists', async () => {
      mockCacheManager.get.mockResolvedValue({ id: '1', name: 'Test' });
      const result = await service.get('product:1');
      expect(result).toEqual({ id: '1', name: 'Test' });
    });

    it('returns null when key does not exist', async () => {
      mockCacheManager.get.mockResolvedValue(undefined);
      const result = await service.get('product:missing');
      expect(result).toBeNull();
    });

    it('returns null and does not throw when Redis is down', async () => {
      mockCacheManager.get.mockRejectedValue(new Error('ECONNREFUSED'));
      await expect(service.get('product:1')).resolves.toBeNull();
    });
  });

  describe('set()', () => {
    it('calls cacheManager.set with key, value, and ttl in seconds', async () => {
      mockCacheManager.set.mockResolvedValue(undefined);
      await service.set('product:1', { id: '1' }, 600);
      expect(mockCacheManager.set).toHaveBeenCalledWith(
        'product:1',
        { id: '1' },
        600,
      );
    });

    it('does not throw when Redis is down', async () => {
      mockCacheManager.set.mockRejectedValue(new Error('ECONNREFUSED'));
      await expect(
        service.set('product:1', { id: '1' }),
      ).resolves.toBeUndefined();
    });
  });

  describe('del()', () => {
    it('calls cacheManager.del with the key', async () => {
      mockCacheManager.del.mockResolvedValue(undefined);
      await service.del('product:1');
      expect(mockCacheManager.del).toHaveBeenCalledWith('product:1');
    });

    it('does not throw when Redis is down', async () => {
      mockCacheManager.del.mockRejectedValue(new Error('ECONNREFUSED'));
      await expect(service.del('product:1')).resolves.toBeUndefined();
    });
  });

  describe('invalidateByPrefix()', () => {
    it('scans and deletes all keys matching prefix in a single page', async () => {
      mockRedisClient.scan.mockResolvedValueOnce({
        cursor: 0,
        keys: ['products:list:a', 'products:list:b'],
      });
      mockRedisClient.del.mockResolvedValue(2);

      await service.invalidateByPrefix('products:list:');

      expect(mockRedisClient.scan).toHaveBeenCalledWith(0, {
        MATCH: 'products:list:*',
        COUNT: 100,
      });
      expect(mockRedisClient.del).toHaveBeenCalledWith([
        'products:list:a',
        'products:list:b',
      ]);
    });

    it('iterates cursor until exhausted', async () => {
      mockRedisClient.scan
        .mockResolvedValueOnce({ cursor: 42, keys: ['products:list:a'] })
        .mockResolvedValueOnce({ cursor: 0, keys: ['products:list:b'] });
      mockRedisClient.del.mockResolvedValue(1);

      await service.invalidateByPrefix('products:list:');

      expect(mockRedisClient.scan).toHaveBeenCalledTimes(2);
      expect(mockRedisClient.del).toHaveBeenCalledTimes(2);
    });

    it('skips del when no keys found', async () => {
      mockRedisClient.scan.mockResolvedValueOnce({ cursor: 0, keys: [] });

      await service.invalidateByPrefix('products:list:');

      expect(mockRedisClient.del).not.toHaveBeenCalled();
    });

    it('does not throw when Redis is down', async () => {
      mockRedisClient.scan.mockRejectedValue(new Error('ECONNREFUSED'));
      await expect(
        service.invalidateByPrefix('products:list:'),
      ).resolves.toBeUndefined();
    });
  });
});
