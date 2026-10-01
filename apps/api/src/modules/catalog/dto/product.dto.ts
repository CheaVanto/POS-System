import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { ProductType } from '@prisma/client';
import {
  IsBoolean,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';

export class CreateProductDto {
  @ApiProperty() @IsString() name!: string;

  @ApiProperty({ enum: ProductType, default: ProductType.SIMPLE })
  @IsOptional()
  @IsEnum(ProductType)
  type?: ProductType;

  @ApiProperty() @IsString() sku!: string;

  @ApiPropertyOptional() @IsOptional() @IsString() barcode?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() categoryId?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() brandId?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() unitId?: string;

  @ApiProperty() @IsOptional() @IsInt() @Min(0) costPrice?: number;
  @ApiProperty() @IsInt() @Min(0) sellPrice!: number;

  @ApiPropertyOptional() @IsOptional() @IsInt() @Min(0) taxRateBps?: number;
  @ApiPropertyOptional({ default: true }) @IsOptional() @IsBoolean() trackStock?: boolean;

  @ApiPropertyOptional() @IsOptional() @IsString() imageUrl?: string;
}

export class UpdateProductDto extends PartialType(CreateProductDto) {}
