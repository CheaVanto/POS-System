import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Permissions } from '../../common/decorators/roles.decorator';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { CreatePurchaseOrderDto, ReceiveDto } from './dto/purchase.dto';
import { PurchaseService } from './purchase.service';

@ApiTags('purchase-orders')
@ApiBearerAuth()
@Controller('purchase-orders')
export class PurchaseController {
  constructor(private readonly purchase: PurchaseService) {}

  @Post()
  @Permissions('purchase:write')
  create(
    @CurrentUser('companyId') companyId: string,
    @CurrentUser('userId') userId: string,
    @Body() dto: CreatePurchaseOrderDto,
  ) {
    return this.purchase.create(companyId, userId, dto);
  }

  @Get()
  @Permissions('purchase:read')
  findAll(@CurrentUser('companyId') companyId: string, @Query() query: PaginationDto) {
    return this.purchase.findAll(companyId, query);
  }

  @Get(':id')
  @Permissions('purchase:read')
  findOne(@CurrentUser('companyId') companyId: string, @Param('id') id: string) {
    return this.purchase.findOne(companyId, id);
  }

  @Post(':id/submit')
  @Permissions('purchase:write')
  submit(@CurrentUser('companyId') companyId: string, @Param('id') id: string) {
    return this.purchase.submit(companyId, id);
  }

  @Post(':id/receive')
  @Permissions('purchase:write')
  @ApiOperation({ summary: 'Receive goods (all or specific lines) into stock' })
  receive(
    @CurrentUser('companyId') companyId: string,
    @CurrentUser('userId') userId: string,
    @Param('id') id: string,
    @Body() dto: ReceiveDto,
  ) {
    return this.purchase.receive(companyId, userId, id, dto);
  }

  @Post(':id/cancel')
  @Permissions('purchase:write')
  cancel(@CurrentUser('companyId') companyId: string, @Param('id') id: string) {
    return this.purchase.cancel(companyId, id);
  }
}
