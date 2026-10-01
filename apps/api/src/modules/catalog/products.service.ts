import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { promises as fs } from 'fs';
import { join } from 'path';
import { PrismaService } from '../../prisma/prisma.service';
import { paginate, PaginationDto } from '../../common/dto/pagination.dto';
import { CreateProductDto, UpdateProductDto } from './dto/product.dto';

export interface UploadedImage {
  buffer: Buffer;
  mimetype: string;
  size: number;
}

const IMAGE_EXT: Record<string, string> = {
  'image/png': 'png',
  'image/jpeg': 'jpg',
  'image/jpg': 'jpg',
  'image/webp': 'webp',
  'image/gif': 'gif',
};

const UPLOAD_ROOT = join(process.cwd(), 'uploads', 'products');

@Injectable()
export class ProductsService {
  constructor(private readonly prisma: PrismaService) {}

  async setImage(companyId: string, id: string, file?: UploadedImage) {
    if (!file) throw new BadRequestException('No file uploaded');
    const ext = IMAGE_EXT[file.mimetype];
    if (!ext) {
      throw new BadRequestException('Unsupported image type (png, jpg, webp, gif only)');
    }
    const product = await this.findOne(companyId, id);

    await fs.mkdir(UPLOAD_ROOT, { recursive: true });
    const filename = `${product.id}-${Date.now()}.${ext}`;
    await fs.writeFile(join(UPLOAD_ROOT, filename), file.buffer);

    if (product.imageUrl?.startsWith('/uploads/products/')) {
      await fs
        .unlink(join(process.cwd(), product.imageUrl.replace(/^\//, '')))
        .catch(() => undefined);
    }

    return this.prisma.product.update({
      where: { id },
      data: { imageUrl: `/uploads/products/${filename}` },
    });
  }

  async create(companyId: string, dto: CreateProductDto) {
    try {
      return await this.prisma.product.create({ data: { ...dto, companyId } });
    } catch (e) {
      if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2002') {
        throw new ConflictException(`SKU "${dto.sku}" already exists`);
      }
      throw e;
    }
  }

  async findAll(companyId: string, query: PaginationDto) {
    const where: Prisma.ProductWhereInput = {
      companyId,
      deletedAt: null,
      ...(query.q
        ? {
            OR: [
              { name: { contains: query.q, mode: 'insensitive' } },
              { sku: { contains: query.q, mode: 'insensitive' } },
              { barcode: { contains: query.q, mode: 'insensitive' } },
            ],
          }
        : {}),
    };

    const [data, total] = await this.prisma.$transaction([
      this.prisma.product.findMany({
        where,
        include: { category: true, brand: true, unit: true },
        orderBy: { createdAt: 'desc' },
        skip: query.skip,
        take: query.limit,
      }),
      this.prisma.product.count({ where }),
    ]);
    return paginate(data, total, query.page, query.limit);
  }

  async findOne(companyId: string, id: string) {
    const product = await this.prisma.product.findFirst({
      where: { id, companyId, deletedAt: null },
      include: { category: true, brand: true, unit: true, variants: true },
    });
    if (!product) throw new NotFoundException('Product not found');
    return product;
  }

  async findByCode(companyId: string, code: string) {
    const product = await this.prisma.product.findFirst({
      where: {
        companyId,
        deletedAt: null,
        isActive: true,
        OR: [{ sku: code }, { barcode: code }],
      },
    });
    if (!product) throw new NotFoundException(`No product for code "${code}"`);
    return product;
  }

  async update(companyId: string, id: string, dto: UpdateProductDto) {
    await this.findOne(companyId, id);
    try {
      return await this.prisma.product.update({ where: { id }, data: dto });
    } catch (e) {
      if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2002') {
        throw new ConflictException(`SKU "${dto.sku}" already exists`);
      }
      throw e;
    }
  }

  async remove(companyId: string, id: string) {
    await this.findOne(companyId, id);
    return this.prisma.product.update({
      where: { id },
      data: { deletedAt: new Date(), isActive: false },
    });
  }
}
