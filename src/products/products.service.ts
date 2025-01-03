import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, FindOptionsWhere, Raw, In } from 'typeorm';
import { Product } from './entities/product.entity';
import { FilesService } from 'src/files/files.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';

@Injectable()
export class ProductsService {
  constructor(
    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>,
    private readonly filesService: FilesService,
  ) {}

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

    return this.productRepository.save(product);
  }

  async findAll(
    page: number = 1,
    limit: number = 10,
    filters?: { name?: string; category?: string; family?: string },
  ) {
    page = page > 0 ? page : 1;
    limit = limit > 0 ? limit : 10;

    const skip = (page - 1) * limit;

    const where: FindOptionsWhere<Product> = {};
    if (filters?.name) {
      where.name = Raw((alias) => `unaccent(${alias}) ILIKE unaccent(:name)`, {
        name: `%${filters.name}%`,
      });
    }
    if (filters?.category) {
      const categories = filters.category.split(',');
      where.category = In(categories);
    }
    if (filters?.family) {
      const families = filters.family.split(',');
      where.family = In(families);
    }

    const [data, total] = await this.productRepository.findAndCount({
      where,
      skip,
      take: limit,
    });

    return {
      data,
      total,
      page,
      lastPage: Math.ceil(total / limit),
    };
  }

  findOne(id: string) {
    return this.productRepository.findOneBy({ id });
  }

  async update(id: string, productData: UpdateProductDto): Promise<any> {
    const { base64Image, ...otherProductData } = productData;

    let imageUrl: string | undefined;

    if (base64Image) {
      imageUrl = await this.filesService.uploadBase64(base64Image, 'products');
    }

    const updateData = { ...otherProductData, ...(imageUrl && { imageUrl }) };
    return this.productRepository.update(id, updateData);
  }

  remove(id: string) {
    return this.productRepository.delete(id);
  }
}
