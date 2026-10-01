import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { PaymentMethod } from '@prisma/client';
import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  Min,
  ValidateNested,
} from 'class-validator';

export class CartItemDto {
  @ApiProperty() @IsString() productId!: string;
  @ApiPropertyOptional() @IsOptional() @IsString() variantId?: string;

  @ApiProperty() @IsInt() @Min(1) quantity!: number;

  @ApiPropertyOptional({ default: 0 }) @IsOptional() @IsInt() @Min(0) discount?: number;
}

export class PaymentInputDto {
  @ApiProperty({ enum: PaymentMethod }) @IsEnum(PaymentMethod) method!: PaymentMethod;
  @ApiProperty() @IsInt() @Min(0) amount!: number;
  @ApiPropertyOptional() @IsOptional() @IsInt() @Min(0) tendered?: number;
  @ApiPropertyOptional() @IsOptional() @IsString() reference?: string;
}

export class CheckoutDto {
  @ApiProperty() @IsString() warehouseId!: string;
  @ApiPropertyOptional() @IsOptional() @IsString() storeId?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() terminalId?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() customerId?: string;

  @ApiProperty({ type: [CartItemDto] })
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => CartItemDto)
  items!: CartItemDto[];

  @ApiProperty({ type: [PaymentInputDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PaymentInputDto)
  payments!: PaymentInputDto[];

  @ApiPropertyOptional({ default: 0 }) @IsOptional() @IsInt() @Min(0) orderDiscount?: number;
  @ApiPropertyOptional({ default: 0 }) @IsOptional() @IsInt() @Min(0) serviceCharge?: number;
  @ApiPropertyOptional({ default: 0 }) @IsOptional() @IsInt() @Min(0) tip?: number;
  @ApiPropertyOptional() @IsOptional() @IsString() note?: string;
}
