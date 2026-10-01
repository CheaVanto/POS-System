import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { StockTxnKind } from '@prisma/client';
import { IsEnum, IsInt, IsOptional, IsString } from 'class-validator';
import { PaginationDto } from '../../../common/dto/pagination.dto';

export class AdjustStockDto {
  @ApiProperty() @IsString() warehouseId!: string;
  @ApiProperty() @IsString() productId!: string;
  @ApiPropertyOptional() @IsOptional() @IsString() variantId?: string;

  @ApiProperty() @IsInt() quantity!: number;

  @ApiPropertyOptional() @IsOptional() @IsInt() unitCost?: number;
  @ApiPropertyOptional() @IsOptional() @IsString() reason?: string;
}

export class InventoryLevelsQueryDto extends PaginationDto {
  @ApiPropertyOptional() @IsOptional() @IsString() branchId?: string;
}

export class InventoryHistoryQueryDto extends PaginationDto {
  @ApiPropertyOptional() @IsOptional() @IsString() branchId?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() warehouseId?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() productId?: string;

  @ApiPropertyOptional({ enum: StockTxnKind })
  @IsOptional()
  @IsEnum(StockTxnKind)
  kind?: StockTxnKind;

  @ApiPropertyOptional() @IsOptional() @IsString() from?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() to?: string;
}
