import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ProductsService } from './products.service';
import { Product } from './entities/product.entity';
import { FilesService } from 'src/files/files.service';
import { CacheService } from 'src/cache/cache.service';

describe('ProductsService', () => {
  let service: ProductsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProductsService,
        { provide: getRepositoryToken(Product), useValue: {} },
        { provide: FilesService, useValue: {} },
        { provide: CacheService, useValue: {} },
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key: string) =>
              ({ CACHE_TTL_PRODUCT: 600, CACHE_TTL_LIST: 300 })[key],
            ),
          },
        },
      ],
    }).compile();

    service = module.get<ProductsService>(ProductsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
