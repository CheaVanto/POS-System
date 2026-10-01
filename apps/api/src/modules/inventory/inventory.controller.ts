import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Permissions } from '../../common/decorators/roles.decorator';
import {
  AdjustStockDto,
  InventoryHistoryQueryDto,
  InventoryLevelsQueryDto,
} from './dto/inventory.dto';
import { InventoryService } from './inventory.service';

@ApiTags('inventory')
@ApiBearerAuth()
@Controller('inventory')
export class InventoryController {
  constructor(private readonly inventory: InventoryService) {}

  @Get('levels')
  @Permissions('inventory:read')
  levels(
    @CurrentUser('companyId') companyId: string,
    @Query() query: InventoryLevelsQueryDto,
  ) {
    return this.inventory.levels(companyId, query, query.branchId);
  }

  @Get('history')
  @Permissions('inventory:history')
  @ApiOperation({ summary: 'Global stock movement history (audit trail)' })
  history(
    @CurrentUser('companyId') companyId: string,
    @Query() query: InventoryHistoryQueryDto,
  ) {
    return this.inventory.history(companyId, query);
  }

  @Get('ledger/:productId')
  @Permissions('inventory:read')
  ledger(
    @CurrentUser('companyId') companyId: string,
    @Param('productId') productId: string,
  ) {
    return this.inventory.ledger(companyId, productId);
  }

  @Post('adjust')
  @Permissions('inventory:adjust')
  adjust(
    @CurrentUser('companyId') companyId: string,
    @CurrentUser('userId') userId: string,
    @Body() dto: AdjustStockDto,
  ) {
    return this.inventory.adjust(companyId, dto, userId);
  }
}
