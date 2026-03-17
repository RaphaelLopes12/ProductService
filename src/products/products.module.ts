import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProductsService } from './products.service';
import { ProductsController } from './products.controller';
import { Product } from './entities/product.entity';
import { FilesModule } from 'src/files/files.module';
import { AppCacheModule } from 'src/cache/cache.module';

@Module({
  imports: [TypeOrmModule.forFeature([Product]), FilesModule, AppCacheModule],
  providers: [ProductsService],
  controllers: [ProductsController],
})
export class ProductsModule {}
