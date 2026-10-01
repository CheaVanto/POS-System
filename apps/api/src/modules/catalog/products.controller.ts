import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiBearerAuth, ApiConsumes, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Permissions } from '../../common/decorators/roles.decorator';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { CreateProductDto, UpdateProductDto } from './dto/product.dto';
import { ProductsService, UploadedImage } from './products.service';

@ApiTags('products')
@ApiBearerAuth()
@Controller('products')
export class ProductsController {
  constructor(private readonly products: ProductsService) {}

  @Post()
  @Permissions('product:write')
  create(@CurrentUser('companyId') companyId: string, @Body() dto: CreateProductDto) {
    return this.products.create(companyId, dto);
  }

  @Get()
  @Permissions('product:read')
  findAll(@CurrentUser('companyId') companyId: string, @Query() query: PaginationDto) {
    return this.products.findAll(companyId, query);
  }

  @Get('lookup/:code')
  @Permissions('product:read')
  @ApiOperation({ summary: 'POS scanner lookup by SKU or barcode' })
  lookup(@CurrentUser('companyId') companyId: string, @Param('code') code: string) {
    return this.products.findByCode(companyId, code);
  }

  @Get(':id')
  @Permissions('product:read')
  findOne(@CurrentUser('companyId') companyId: string, @Param('id') id: string) {
    return this.products.findOne(companyId, id);
  }

  @Patch(':id')
  @Permissions('product:write')
  update(
    @CurrentUser('companyId') companyId: string,
    @Param('id') id: string,
    @Body() dto: UpdateProductDto,
  ) {
    return this.products.update(companyId, id, dto);
  }

  @Post(':id/image')
  @Permissions('product:write')
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FileInterceptor('file', { limits: { fileSize: 15 * 1024 * 1024 } }))
  uploadImage(
    @CurrentUser('companyId') companyId: string,
    @Param('id') id: string,
    @UploadedFile() file: UploadedImage,
  ) {
    return this.products.setImage(companyId, id, file);
  }

  @Delete(':id')
  @Permissions('product:write')
  remove(@CurrentUser('companyId') companyId: string, @Param('id') id: string) {
    return this.products.remove(companyId, id);
  }
}
