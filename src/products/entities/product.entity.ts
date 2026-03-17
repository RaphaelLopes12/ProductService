import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  Index,
} from 'typeorm';

@Entity()
export class Product {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column()
  description: string;

  @Column('decimal')
  price: number;

  @Column('int')
  stockQuantity: number;

  @Column({ unique: true })
  sku: string;

  @Column({ nullable: true })
  ean: string;

  @Index()
  @Column({ nullable: true })
  family: string;

  @Index()
  @Column({ nullable: true })
  category: string;

  @Column({ nullable: true })
  imageUrl: string;

  @CreateDateColumn()
  createdAt: Date;
}
