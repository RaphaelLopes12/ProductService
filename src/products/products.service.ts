import { Injectable, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, FindOptionsWhere, Raw, In } from 'typeorm';
import { Product } from './entities/product.entity';
import { FilesService } from 'src/files/files.service';
import { CacheService } from 'src/cache/cache.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';

function buildListCacheKey(
  page: number,
  limit: number,
  filters: { name?: string; category?: string; family?: string },
): string {
  const params: Record<string, string> = {
    page: String(page),
    limit: String(limit),
  };
  if (filters.name) params.name = filters.name;
  if (filters.category) params.category = filters.category;
  if (filters.family) params.family = filters.family;

  const query = Object.keys(params)
    .sort()
    .map((k) => `${k}=${params[k]}`)
    .join('&');

  return `products:list:${query}`;
}

@Injectable()
export class ProductsService {
  private readonly productTtl: number;
  private readonly listTtl: number;

  constructor(
    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>,
    private readonly filesService: FilesService,
    private readonly cacheService: CacheService,
    private readonly configService: ConfigService,
  ) {
    this.productTtl = this.configService.get<number>('CACHE_TTL_PRODUCT');
    this.listTtl = this.configService.get<number>('CACHE_TTL_LIST');
  }

  async create(productData: CreateProductDto): Promise<Product> {
    const { base64Image, ...otherProductData } = productData;

    let imageUrl: string | undefined;
    if (base64Image) {
      imageUrl = await this.filesService.uploadBase64(base64Image, 'products');
    }

    const product = this.productRepository.create({
      ...otherProductData,
      imageUrl,
    });
    const saved = await this.productRepository.save(product);

    await this.cacheService.set(`product:${saved.id}`, saved, this.productTtl);
    await this.cacheService.invalidateByPrefix('products:list:');

    return saved;
  }

  async findAll(
    page: number = 1,
    limit: number = 10,
    filters?: { name?: string; category?: string; family?: string },
  ) {
    page = page > 0 ? page : 1;
    limit = Math.min(limit > 0 ? limit : 10, 100);

    const key = buildListCacheKey(page, limit, filters ?? {});
    const cached = await this.cacheService.get<{
      data: Product[];
      total: number;
      page: number;
      lastPage: number;
    }>(key);
    if (cached) return cached;

    const skip = (page - 1) * limit;
    const where: FindOptionsWhere<Product> = {};

    if (filters?.name) {
      where.name = Raw((alias) => `unaccent(${alias}) ILIKE unaccent(:name)`, {
        name: `%${filters.name}%`,
      });
    }
    if (filters?.category) {
      where.category = In(filters.category.split(','));
    }
    if (filters?.family) {
      where.family = In(filters.family.split(','));
    }

    const [data, total] = await this.productRepository.findAndCount({
      where,
      skip,
      take: limit,
    });

    const result = { data, total, page, lastPage: Math.ceil(total / limit) };
    await this.cacheService.set(key, result, this.listTtl);
    return result;
  }

  async findOne(id: string): Promise<Product> {
    const key = `product:${id}`;
    const cached = await this.cacheService.get<Product>(key);
    if (cached) return cached;

    const product = await this.productRepository.findOneBy({ id });
    if (!product) throw new NotFoundException(`Product ${id} not found`);

    await this.cacheService.set(key, product, this.productTtl);
    return product;
  }

  async update(id: string, productData: UpdateProductDto): Promise<any> {
    await this.cacheService.del(`product:${id}`);
    await this.cacheService.invalidateByPrefix('products:list:');

    const { base64Image, ...otherProductData } = productData;
    let imageUrl: string | undefined;
    if (base64Image) {
      imageUrl = await this.filesService.uploadBase64(base64Image, 'products');
    }

    const updateData = { ...otherProductData, ...(imageUrl && { imageUrl }) };
    return this.productRepository.update(id, updateData);
  }

  async remove(id: string) {
    const result = await this.productRepository.delete(id);
    await this.cacheService.del(`product:${id}`);
    await this.cacheService.invalidateByPrefix('products:list:');
    return result;
  }
}
