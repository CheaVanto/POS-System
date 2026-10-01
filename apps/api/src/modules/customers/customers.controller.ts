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
import { IsEmail, IsOptional, IsString } from 'class-validator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Permissions } from '../../common/decorators/roles.decorator';
import { paginate, PaginationDto } from '../../common/dto/pagination.dto';
import { PrismaService } from '../../prisma/prisma.service';

class CreateCustomerDto {
  @IsString() name!: string;
  @IsOptional() @IsEmail() email?: string;
  @IsOptional() @IsString() phone?: string;
  @IsOptional() @IsString() address?: string;
}
class UpdateCustomerDto extends PartialType(CreateCustomerDto) {}

@Injectable()
export class CustomersService {
  constructor(private readonly prisma: PrismaService) {}

  create(companyId: string, dto: CreateCustomerDto) {
    return this.prisma.customer.create({ data: { ...dto, companyId } });
  }

  async findAll(companyId: string, query: PaginationDto) {
    const where: Prisma.CustomerWhereInput = {
      companyId,
      deletedAt: null,
      ...(query.q
        ? {
            OR: [
              { name: { contains: query.q, mode: 'insensitive' } },
              { phone: { contains: query.q } },
            ],
          }
        : {}),
    };
    const [data, total] = await this.prisma.$transaction([
      this.prisma.customer.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: query.skip,
        take: query.limit,
      }),
      this.prisma.customer.count({ where }),
    ]);
    return paginate(data, total, query.page, query.limit);
  }

  async findOne(companyId: string, id: string) {
    const c = await this.prisma.customer.findFirst({
      where: { id, companyId, deletedAt: null },
    });
    if (!c) throw new NotFoundException('Customer not found');
    return c;
  }

  async update(companyId: string, id: string, dto: UpdateCustomerDto) {
    await this.findOne(companyId, id);
    return this.prisma.customer.update({ where: { id }, data: dto });
  }
}

@ApiTags('customers')
@ApiBearerAuth()
@Controller('customers')
export class CustomersController {
  constructor(private readonly customers: CustomersService) {}

  @Post()
  @Permissions('customer:write')
  create(@CurrentUser('companyId') companyId: string, @Body() dto: CreateCustomerDto) {
    return this.customers.create(companyId, dto);
  }

  @Get()
  @Permissions('customer:read')
  findAll(@CurrentUser('companyId') companyId: string, @Query() query: PaginationDto) {
    return this.customers.findAll(companyId, query);
  }

  @Get(':id')
  @Permissions('customer:read')
  findOne(@CurrentUser('companyId') companyId: string, @Param('id') id: string) {
    return this.customers.findOne(companyId, id);
  }

  @Patch(':id')
  @Permissions('customer:write')
  update(
    @CurrentUser('companyId') companyId: string,
    @Param('id') id: string,
    @Body() dto: UpdateCustomerDto,
  ) {
    return this.customers.update(companyId, id, dto);
  }
}
