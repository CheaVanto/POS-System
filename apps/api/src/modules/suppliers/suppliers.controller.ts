import {
  Body,
  Controller,
  Get,
  Injectable,
  NotFoundException,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags, PartialType } from '@nestjs/swagger';
import { Prisma } from '@prisma/client';
import { IsEmail, IsInt, IsOptional, IsString, Max, Min } from 'class-validator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Permissions } from '../../common/decorators/roles.decorator';
import { paginate, PaginationDto } from '../../common/dto/pagination.dto';
import { PrismaService } from '../../prisma/prisma.service';

class CreateSupplierDto {
  @IsString() name!: string;
  @IsOptional() @IsString() contactName?: string;
  @IsOptional() @IsEmail() email?: string;
  @IsOptional() @IsString() phone?: string;
  @IsOptional() @IsString() address?: string;
  @IsOptional() @IsString() taxId?: string;
  @IsOptional() @IsInt() @Min(1) @Max(5) rating?: number;
  @IsOptional() @IsString() notes?: string;
}
class UpdateSupplierDto extends PartialType(CreateSupplierDto) {}

@Injectable()
export class SuppliersService {
  constructor(private readonly prisma: PrismaService) {}

  create(companyId: string, dto: CreateSupplierDto) {
    return this.prisma.supplier.create({ data: { ...dto, companyId } });
  }

  async findAll(companyId: string, query: PaginationDto) {
    const where: Prisma.SupplierWhereInput = {
      companyId,
      deletedAt: null,
      ...(query.q
        ? {
            OR: [
              { name: { contains: query.q, mode: 'insensitive' } },
              { phone: { contains: query.q } },
              { email: { contains: query.q, mode: 'insensitive' } },
            ],
          }
        : {}),
    };
    const [data, total] = await this.prisma.$transaction([
      this.prisma.supplier.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: query.skip,
        take: query.limit,
      }),
      this.prisma.supplier.count({ where }),
    ]);
    return paginate(data, total, query.page, query.limit);
  }

  async findOne(companyId: string, id: string) {
    const s = await this.prisma.supplier.findFirst({
      where: { id, companyId, deletedAt: null },
    });
    if (!s) throw new NotFoundException('Supplier not found');
    return s;
  }

  async update(companyId: string, id: string, dto: UpdateSupplierDto) {
    await this.findOne(companyId, id);
    return this.prisma.supplier.update({ where: { id }, data: dto });
  }
}

@ApiTags('suppliers')
@ApiBearerAuth()
@Controller('suppliers')
export class SuppliersController {
  constructor(private readonly suppliers: SuppliersService) {}

  @Post()
  @Permissions('supplier:write')
  create(@CurrentUser('companyId') companyId: string, @Body() dto: CreateSupplierDto) {
    return this.suppliers.create(companyId, dto);
  }

  @Get()
  @Permissions('supplier:read')
  findAll(@CurrentUser('companyId') companyId: string, @Query() query: PaginationDto) {
    return this.suppliers.findAll(companyId, query);
  }

  @Get(':id')
  @Permissions('supplier:read')
  findOne(@CurrentUser('companyId') companyId: string, @Param('id') id: string) {
    return this.suppliers.findOne(companyId, id);
  }

  @Patch(':id')
  @Permissions('supplier:write')
  update(
    @CurrentUser('companyId') companyId: string,
    @Param('id') id: string,
    @Body() dto: UpdateSupplierDto,
  ) {
    return this.suppliers.update(companyId, id, dto);
  }
}
