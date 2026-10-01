import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Permissions } from '../../common/decorators/roles.decorator';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { CheckoutDto } from './dto/checkout.dto';
import { SalesService } from './sales.service';

@ApiTags('sales')
@ApiBearerAuth()
@Controller('sales')
export class SalesController {
  constructor(private readonly sales: SalesService) {}

  @Post('checkout')
  @Permissions('sale:create')
  @ApiOperation({ summary: 'Complete a POS sale (atomic: stock + payment + receipt)' })
  checkout(
    @CurrentUser('companyId') companyId: string,
    @CurrentUser('userId') userId: string,
    @Body() dto: CheckoutDto,
  ) {
    return this.sales.checkout(companyId, userId, dto);
  }

  @Get()
  @Permissions('sale:read')
  findAll(@CurrentUser('companyId') companyId: string, @Query() query: PaginationDto) {
    return this.sales.findAll(companyId, query);
  }

  @Get(':id')
  @Permissions('sale:read')
  findOne(@CurrentUser('companyId') companyId: string, @Param('id') id: string) {
    return this.sales.findOne(companyId, id);
  }

  @Post(':id/refund')
  @Permissions('sale:refund')
  refund(
    @CurrentUser('companyId') companyId: string,
    @CurrentUser('userId') userId: string,
    @Param('id') id: string,
  ) {
    return this.sales.refund(companyId, userId, id);
  }
}
