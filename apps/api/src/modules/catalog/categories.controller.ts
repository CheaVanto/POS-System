import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Injectable,
  NotFoundException,
  Param,
  Patch,
  Post,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { IsBoolean, IsOptional, IsString } from 'class-validator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Permissions } from '../../common/decorators/roles.decorator';
import { PrismaService } from '../../prisma/prisma.service';

class UpsertCategoryDto {
  @IsString() name!: string;
  @IsOptional() @IsString() parentId?: string;
}

class UpdateCategoryDto {
  @IsOptional() @IsString() name?: string;
  @IsOptional() @IsString() parentId?: string | null;
  @IsOptional() @IsBoolean() isActive?: boolean;
}

@Injectable()
export class CategoriesService {
  constructor(private readonly prisma: PrismaService) {}

  list(companyId: string) {
    return this.prisma.category.findMany({
      where: { companyId, deletedAt: null },
      orderBy: { name: 'asc' },
    });
  }

  create(companyId: string, dto: UpsertCategoryDto) {
    return this.prisma.category.create({ data: { ...dto, companyId } });
  }

  private async getOwned(companyId: string, id: string) {
    const found = await this.prisma.category.findFirst({
      where: { id, companyId, deletedAt: null },
    });
    if (!found) throw new NotFoundException('Category not found');
    return found;
  }

  async update(companyId: string, id: string, dto: UpdateCategoryDto) {
    await this.getOwned(companyId, id);
    if (dto.parentId) {
      if (dto.parentId === id) throw new BadRequestException('A category cannot be its own parent');
      await this.getOwned(companyId, dto.parentId);
    }
    return this.prisma.category.update({
      where: { id },
      data: {
        ...(dto.name !== undefined ? { name: dto.name } : {}),
        ...(dto.parentId !== undefined ? { parentId: dto.parentId || null } : {}),
        ...(dto.isActive !== undefined ? { isActive: dto.isActive } : {}),
      },
    });
  }

  async remove(companyId: string, id: string) {
    await this.getOwned(companyId, id);
    return this.prisma.category.update({ where: { id }, data: { deletedAt: new Date() } });
  }
}

@ApiTags('categories')
@ApiBearerAuth()
@Controller('categories')
export class CategoriesController {
  constructor(private readonly categories: CategoriesService) {}

  @Get()
  @Permissions('product:read')
  list(@CurrentUser('companyId') companyId: string) {
    return this.categories.list(companyId);
  }

  @Post()
  @Permissions('product:write')
  create(@CurrentUser('companyId') companyId: string, @Body() dto: UpsertCategoryDto) {
    return this.categories.create(companyId, dto);
  }

  @Patch(':id')
  @Permissions('product:write')
  update(
    @CurrentUser('companyId') companyId: string,
    @Param('id') id: string,
    @Body() dto: UpdateCategoryDto,
  ) {
    return this.categories.update(companyId, id, dto);
  }

  @Delete(':id')
  @Permissions('product:write')
  remove(@CurrentUser('companyId') companyId: string, @Param('id') id: string) {
    return this.categories.remove(companyId, id);
  }
}
