import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsInt,
  IsISO8601,
  IsOptional,
  IsString,
  Min,
  ValidateNested,
} from 'class-validator';

export class PoItemDto {
  @ApiProperty() @IsString() productId!: string;
  @ApiPropertyOptional() @IsOptional() @IsString() variantId?: string;
  @ApiProperty() @IsInt() @Min(1) quantity!: number;
  @ApiProperty() @IsInt() @Min(0) unitCost!: number;
  @ApiPropertyOptional({ default: 0 }) @IsOptional() @IsInt() @Min(0) taxRateBps?: number;
}

export class CreatePurchaseOrderDto {
  @ApiProperty() @IsString() supplierId!: string;
  @ApiProperty() @IsString() warehouseId!: string;

  @ApiProperty({ type: [PoItemDto] })
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => PoItemDto)
  items!: PoItemDto[];

  @ApiPropertyOptional() @IsOptional() @IsISO8601() expectedAt?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() note?: string;
}

export class ReceiveLineDto {
  @ApiProperty() @IsString() itemId!: string;
  @ApiProperty() @IsInt() @Min(1) quantity!: number;
}

export class ReceiveDto {
  @ApiPropertyOptional({ type: [ReceiveLineDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ReceiveLineDto)
  lines?: ReceiveLineDto[];
}
